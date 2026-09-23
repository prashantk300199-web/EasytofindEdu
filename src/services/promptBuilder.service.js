/**
 * Builds structured prompts for the AI career counselor.
 * All prompts include student context, grounding data, and action formatting.
 */

const QUICK_PROMPTS = [
  { id: "explore_careers", label: "Explore Careers", prompt: "Show me some career options I should consider." },
  { id: "compare_careers", label: "Compare Careers", prompt: "Help me compare two careers." },
  { id: "next_learning", label: "What Should I Learn Next?", prompt: "What skills should I develop next based on my profile?" },
  { id: "exams", label: "Exams I Can Take", prompt: "What entrance exams are relevant for me?" },
  { id: "courses", label: "Courses for Me", prompt: "What courses or degrees should I consider?" },
  { id: "learning_plan", label: "Make My 3-Month Plan", prompt: "Help me create a 3-month learning plan to advance my career goals." },
  { id: "alternatives", label: "Alternative Careers", prompt: "What are some alternative career paths I should consider?" },
  { id: "confused", label: "I'm Confused", prompt: "I feel confused about my career. Can you help me explore my options?" },
];

/**
 * Build a student-aware system prompt with context data.
 */
export function buildSystemPrompt(studentContext, careerData = null) {
  let prompt = `You are a warm, knowledgeable career counselor for Indian students. Your role is to help students explore careers, understand education paths, and plan their futures.

== STUDENT PROFILE ==
`;

  if (!studentContext.hasProfile) {
    prompt += `The student has NOT completed the career profile questionnaire. Encourage them to complete it for personalized guidance.
Profile status: Incomplete — no education/interest data available yet.
`;
  } else {
    const ctx = studentContext.basics;
    const cg = studentContext.careerGuidance;
    const prefs = cg.preferences || {};

    prompt += `Education Level: ${ctx.educationLevel || "Not specified"}
Class/Board: ${ctx.board || "—"}, ${ctx.school || "—"}
Stream: ${cg.stream || "Not specified"}
Interests: ${cg.interests?.join(", ") || "Not specified"}
Preferred Cities: ${prefs.preferredCities?.join(", ") || "Any"}
Budget: ${prefs.budget || "Not specified"}
Career Goal: ${prefs.careerGoal || "Not specified"}
Relocation: ${prefs.relocation || "Not specified"}
Profile completed: ${cg.isComplete ? "Yes" : "No"}
`;
  }

  if (studentContext.savedCareers?.length > 0) {
    prompt += `\n== SAVED CAREERS ==
${studentContext.savedCareers.map((c, i) => `${i + 1}. ${c.title} (${c.type}) — ${c.difficulty || ""}`).join("\n")}
`;
  }

  if (studentContext.topRecommendations?.length > 0) {
    prompt += `\n== TOP CAREER RECOMMENDATIONS ==
${studentContext.topRecommendations.map((r, i) => `${i + 1}. ${r.title} (${r.type})`).join("\n")}
These were matched to the student's profile. Use them as a starting point.
`;
  }

  if (careerData?.node) {
    const node = careerData.node;
    prompt += `\n== CURRENT CAREER DISCUSSION ==
Career: ${node.title}
Type: ${node.nodeType}
`;
    if (node.description) prompt += `Description: ${node.description.substring(0, 300)}\n`;
    if (node.eligibility?.qualifications?.length) prompt += `Eligibility: ${node.eligibility.qualifications.join(", ")}\n`;
    if (node.eligibility?.streams?.length) prompt += `Streams: ${node.eligibility.streams.join(", ")}\n`;
    if (node.duration?.value) prompt += `Duration: ${node.duration.value} ${node.duration.unit || "months"}\n`;
    if (node.prerequisites?.length) prompt += `Prerequisites: ${node.prerequisites.map((p) => p.title).join(", ")}\n`;
    if (node.nextSteps?.length) prompt += `Next Steps: ${node.nextSteps.map((n) => n.title).join(", ")}\n`;
    if (node.tags?.length) prompt += `Related Topics: ${node.tags.join(", ")}\n`;
  }

  if (careerData?.programs?.length > 0) {
    prompt += `\n== RELATED PROGRAMS ==
${careerData.programs.map((p) => `- ${p.title} (${p.category})`).join("\n")}
`;
  }

  if (careerData?.institutes?.length > 0) {
    prompt += `\n== INSTITUTES OFFERING THIS CAREER PATH ==
${careerData.institutes.slice(0, 5).map((i) => `- ${i.courseName || i.instituteName || "Institute"} (${i.instituteLocation || "Location not specified"})`).join("\n")}
`;
  }

  if (careerData?.exams?.length > 0) {
    prompt += `\n== RELEVANT ENTRANCE EXAMS ==
${careerData.exams.map((e) => `- ${e.name} | Type: ${e.type || "N/A"} | Fee: ${e.applicationFee || "Check website"} | Next Exam: ${e.nextExamDate}`).join("\n")}
`;
  }

  if (careerData?.colleges?.length > 0) {
    prompt += `\n== COLLEGES (Verify details from official websites) ==
${careerData.colleges.slice(0, 5).map((c) => `- ${c.name}${c.shortName ? ` (${c.shortName})` : ""} | ${c.city || "—"} | Rank: ${c.nirfRank || "N/A"}`).join("\n")}
`;
  }

  prompt += `

== RESPONSE FORMATTING ==
- Use **bold headings** for sections
- Use bullet points for lists
- Keep paragraphs short (2-3 sentences max)
- For numerical scores, use "Profile Match: X%" — never "probability" or "guaranteed"
- When suggesting actions the user can take, format as:
  **Actions:** [Explore this career → /career-explorer/slug] [Compare → /career/compare?compare=id1,id2] [Add to roadmap → /career/roadmap/id]
- When discussing exams/institutes/fees/salaries, note that information should be verified from official sources
- If you don't know something, say "I don't have that information — please check the official website."
- Do NOT invent specific numbers (fees, salaries, seat counts, dates) unless confirmed in the provided data

== RESPONSE STYLE ==
- Be conversational but informative
- Show empathy, especially when students seem anxious or confused
- Ask one clarifying question if the profile is incomplete
- For "I don't know" questions, explore multiple career areas rather than choosing one
- When comparing careers, present facts neutrally without declaring a winner
- For learning plans, mention that the plan should be adapted based on their actual available time`;

  return prompt;
}

/**
 * Build initial message for a new conversation.
 */
export function buildInitialMessage(studentContext) {
  const name = studentContext?.basics?.name;
  const greeting = name ? `Hi ${name}!` : "Hi there!";

  let message = `${greeting} I'm your AI Career Counselor on EasyToFindEdu. I'm here to help you explore careers, understand education paths, and plan your future.`;

  if (!studentContext?.hasProfile) {
    message += `\n\nI notice you haven't completed your career profile yet. While I can still help, you'll get much more personalized guidance if you fill in your education and interests. Want me to guide you through it, or shall we start with a general career question?`;
  } else {
    const savedCount = studentContext.savedCareers?.length || 0;
    const interest = studentContext.careerGuidance?.interests?.[0] || studentContext.basics?.stream;

    message += `\n\nI can see you're ${studentContext.basics?.educationLevel || "at an important stage"}`;
    if (interest) message += ` with interests in ${interest}`;
    message += `.`;
    if (savedCount > 0) message += ` I also see you have ${savedCount} saved career${savedCount > 1 ? "s" : ""} — want to continue exploring any of those?`;
    message += `\n\nWhat would you like to explore today?`;
  }

  return message;
}

/**
 * Build the "I Don't Know What To Do" exploration prompt.
 */
export function buildIDontKnowPrompt(studentContext) {
  let prompt = buildSystemPrompt(studentContext);

  prompt += `

== SPECIAL MODE: CAREER EXPLORATION FOR UNDECIDED STUDENTS ==
This student has indicated they are confused or unsure about their career direction. Your goal is to:
1. Help them discover patterns in what they naturally enjoy and are good at
2. Present 2-4 diverse career areas (not specific careers) that might fit
3. For each area, explain WHY it might suit them based on available profile data
4. Suggest ONE small, low-commitment experiment they can try this week
5. Do NOT force a decision — the goal is exploration, not commitment

Start by asking 2-3 gentle questions about what subjects they enjoy, what activities give them energy, and what kind of environment they see themselves in (office, outdoors, lab, creative studio, etc.).

After they answer, present a "Career Exploration Map" with 2-4 areas, each with:
- Area name and brief description
- Why it might fit them (based on their answers)
- Education path in 1-2 sentences
- One experiment suggestion (concrete, 1-2 hours max)
- A gentle next step

End by asking which area interests them most, without pressuring a choice.`;

  return prompt;
}

export { QUICK_PROMPTS };

export default {
  buildSystemPrompt,
  buildInitialMessage,
  buildIDontKnowPrompt,
  QUICK_PROMPTS,
};
