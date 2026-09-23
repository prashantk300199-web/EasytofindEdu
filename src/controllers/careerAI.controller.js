import CareerAIConversation from "../models/CareerAIConversation.js";
import { buildStudentContext, fetchCareerData, fetchInstitutesForCareer, fetchExamsForCareer, searchColleges } from "../services/studentContextBuilder.service.js";
import { buildSystemPrompt, buildInitialMessage, buildIDontKnowPrompt, QUICK_PROMPTS } from "../services/promptBuilder.service.js";
import { generateResponse, isConfigured } from "../services/gemini.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

// ─── Controller Handlers ────────────────────────────────────────────────────────

/**
 * GET /api/v1/career-ai/conversations
 * List all conversations for the authenticated student.
 */
export const listConversations = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const conversations = await CareerAIConversation.find({
    studentId,
    status: "active",
  })
    .select("title lastMessageAt messageCount createdAt updatedAt")
    .sort({ lastMessageAt: -1 })
    .lean();

  res.status(200).json(
    new ApiResponse(200, conversations, "Conversations retrieved")
  );
});

/**
 * POST /api/v1/career-ai/conversations
 * Create a new conversation.
 */
export const createConversation = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { mode } = req.body; // "exploration" = "I don't know"

  const studentContext = await buildStudentContext(studentId);

  let initialContent;
  if (mode === "exploration") {
    initialContent = buildIDontKnowPrompt(studentContext);
  } else {
    initialContent = buildInitialMessage(studentContext);
  }

  const conversation = new CareerAIConversation({
    studentId,
    title: mode === "exploration" ? "Career Exploration" : "New Conversation",
    messages: [
      {
        role: "user",
        content: mode === "exploration"
          ? "I'm not sure what career I want. Can you help me figure it out?"
          : "I want to explore careers.",
        timestamp: new Date(),
      },
    ],
    context: {
      educationLevel: studentContext?.basics?.educationLevel || "",
      stream: studentContext?.careerGuidance?.stream || "",
      interests: studentContext?.careerGuidance?.interests || [],
      skills: studentContext?.basics?.skills || [],
    },
  });

  // Generate AI initial response
  if (isConfigured()) {
    try {
      const systemPrompt = mode === "exploration"
        ? buildIDontKnowPrompt(studentContext)
        : buildSystemPrompt(studentContext);

      const aiResponse = await generateResponse(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: conversation.messages[0].content },
        ],
        { temperature: 0.8, maxOutputTokens: 2048 }
      );

      conversation.messages.push({
        role: "model",
        content: aiResponse,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error("AI response generation failed", err);
      conversation.messages.push({
        role: "model",
        content: "Hello! I'm your AI Career Counselor. I'm here to help you explore careers. What would you like to know today?",
        timestamp: new Date(),
      });
    }
  } else {
    conversation.messages.push({
      role: "model",
      content: "Hello! I'm your AI Career Counselor. It looks like AI is not configured yet — but your career guidance features are fully functional. Please check back soon!",
      timestamp: new Date(),
    });
  }

  await conversation.save();

  res.status(201).json(
    new ApiResponse(201, {
      _id: conversation._id,
      title: conversation.title,
      messages: conversation.messages,
      messageCount: conversation.messageCount,
      createdAt: conversation.createdAt,
    }, "Conversation created")
  );
});

/**
 * GET /api/v1/career-ai/conversations/:conversationId
 * Get a single conversation (student can only access their own).
 */
export const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const studentId = req.user._id;

  const conversation = await CareerAIConversation.findOne({
    _id: conversationId,
    studentId,
  }).lean();

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  res.status(200).json(
    new ApiResponse(200, conversation, "Conversation retrieved")
  );
});

/**
 * POST /api/v1/career-ai/conversations/:conversationId/messages
 * Send a message in an existing conversation.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, action } = req.body;
  const studentId = req.user._id;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new ApiError(400, "Message content is required");
  }

  if (content.length > 2000) {
    throw new ApiError(400, "Message must be under 2000 characters");
  }

  const conversation = await CareerAIConversation.findOne({
    _id: conversationId,
    studentId,
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (conversation.status !== "active") {
    throw new ApiError(400, "This conversation is archived");
  }

  // Add user message
  conversation.messages.push({
    role: "user",
    content: content.trim(),
    timestamp: new Date(),
  });

  // Build context
  const studentContext = await buildStudentContext(studentId);

  // Check if this is a career-specific question and fetch data
  let careerData = null;
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("what is") ||
    lowerContent.includes("explain") ||
    lowerContent.includes("career in") ||
    action?.type === "explore_career"
  ) {
    // Extract potential career name from message
    const words = content.split(" ").slice(-5).join(" ");
    careerData = await fetchCareerData(words);
    if (careerData?.node) {
      const [institutes, exams] = await Promise.all([
        fetchInstitutesForCareer(careerData.node.title, 5),
        fetchExamsForCareer(careerData.node.title, 5),
      ]);
      careerData.institutes = institutes;
      careerData.exams = exams;
    }
  }

  if (
    lowerContent.includes("college") ||
    lowerContent.includes("institute") ||
    lowerContent.includes("university") ||
    action?.type === "find_institutes"
  ) {
    const words = content.split(" ").slice(-3).join(" ");
    careerData = careerData || {};
    careerData.colleges = await searchColleges(words, 5);
  }

  if (
    lowerContent.includes("entrance exam") ||
    lowerContent.includes("exam") ||
    action?.type === "find_exams"
  ) {
    const words = content.split(" ").slice(-3).join(" ");
    careerData = careerData || {};
    careerData.exams = await fetchExamsForCareer(words, 5);
  }

  const systemPrompt = buildSystemPrompt(studentContext, careerData);

  // Build message history for context (last 10 messages)
  const recentMessages = conversation.messages.slice(-10).map((m) => ({
    role: m.role === "model" ? "model" : "user",
    content: m.content,
  }));

  // Generate AI response
  let aiContent;
  if (isConfigured()) {
    try {
      aiContent = await generateResponse(
        [
          { role: "system", content: systemPrompt },
          ...recentMessages,
        ],
        { temperature: 0.75, maxOutputTokens: 2500 }
      );
    } catch (err) {
      logger.error("Gemini generation failed", err);
      if (err.message.includes("API error")) {
        throw new ApiError(503, "AI service is temporarily unavailable. Please try again in a moment.");
      }
      throw new ApiError(500, "Failed to generate response. Please try again.");
    }
  } else {
    aiContent = `I'm here to help! To enable AI-powered responses, please configure the GEMINI_API_KEY environment variable.\n\nIn the meantime, you can:\n- Browse careers at /career-explorer\n- Take the questionnaire at /career-guidance\n- View recommendations at /career/recommendations`;
  }

  // Add AI response
  conversation.messages.push({
    role: "model",
    content: aiContent,
    timestamp: new Date(),
    metadata: careerData?.node ? { careerSlug: careerData.node.slug } : {},
  });

  await conversation.save();

  res.status(200).json(
    new ApiResponse(200, {
      message: {
        role: "model",
        content: aiContent,
        timestamp: new Date(),
      },
      messageCount: conversation.messageCount,
    }, "Message sent")
  );
});

/**
 * DELETE /api/v1/career-ai/conversations/:conversationId
 * Archive a conversation.
 */
export const archiveConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const studentId = req.user._id;

  const conversation = await CareerAIConversation.findOneAndUpdate(
    { _id: conversationId, studentId },
    { status: "archived" },
    { new: true }
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  res.status(200).json(
    new ApiResponse(200, { archived: true }, "Conversation archived")
  );
});

/**
 * GET /api/v1/career-ai/quick-prompts
 * Get available quick prompt suggestions.
 */
export const getQuickPrompts = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, QUICK_PROMPTS, "Quick prompts retrieved")
  );
});

/**
 * GET /api/v1/career-ai/profile-context
 * Get current student's AI context (for frontend to display profile summary).
 */
export const getProfileContext = asyncHandler(async (req, res) => {
  const studentContext = await buildStudentContext(req.user._id);
  res.status(200).json(
    new ApiResponse(200, studentContext, "Profile context retrieved")
  );
});

export default {
  listConversations,
  createConversation,
  getConversation,
  sendMessage,
  archiveConversation,
  getQuickPrompts,
  getProfileContext,
};
