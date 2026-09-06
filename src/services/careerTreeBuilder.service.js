import CareerPathNode from "../models/CareerPathNode.js";
import ApiError from "../utils/ApiError.js";
import { NODE_STATUS, NODE_TYPES } from "../constants/careerGuidance.constants.js";

const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
};

/**
 * Build complete tree structure from root nodes
 */
export const buildCareerTree = async (startingQualification = null) => {
  try {
    let rootNodes;

    if (startingQualification) {
      rootNodes = await CareerPathNode.find({
        status: NODE_STATUS.ACTIVE,
        level: 1,
        applicableQualifications: startingQualification,
      }).lean();
    } else {
      rootNodes = await CareerPathNode.find({
        status: NODE_STATUS.ACTIVE,
        level: 1,
      }).lean();
    }

    const treeStructure = await Promise.all(
      rootNodes.map((node) => buildNodeTree(node._id, visited = []))
    );

    logger.info("Career tree built", { nodeCount: flattenTree(treeStructure).length });
    return treeStructure;
  } catch (error) {
    logger.error("Error building career tree", error);
    throw new ApiError(500, "Failed to build career tree");
  }
};

/**
 * Build tree recursively from a single node
 */
const buildNodeTree = async (nodeId, visited = []) => {
  try {
    // Prevent circular references
    if (visited.includes(nodeId.toString())) {
      return null;
    }

    const node = await CareerPathNode.findById(nodeId)
      .select("title slug nodeType description level nextNodeIds cost duration")
      .lean();

    if (!node || node.status !== NODE_STATUS.ACTIVE) {
      return null;
    }

    const children = await Promise.all(
      (node.nextNodeIds || []).map((childId) =>
        buildNodeTree(childId, [...visited, nodeId.toString()])
      )
    );

    return {
      ...node,
      children: children.filter((c) => c !== null),
    };
  } catch (error) {
    logger.error("Error building node tree", error);
    return null;
  }
};

/**
 * Get all paths from one node to another
 */
export const getAllPathsBetween = async (startNodeId, endNodeId) => {
  try {
    const allPaths = [];
    const visited = new Set();

    const dfs = async (currentId, path) => {
      if (visited.has(currentId.toString())) {
        return;
      }

      visited.add(currentId.toString());
      path.push(currentId);

      if (currentId.toString() === endNodeId.toString()) {
        allPaths.push([...path]);
      } else {
        const node = await CareerPathNode.findById(currentId).select("nextNodeIds").lean();
        if (node && node.nextNodeIds) {
          for (const nextId of node.nextNodeIds) {
            await dfs(nextId, [...path]);
          }
        }
      }
    };

    await dfs(startNodeId, []);

    logger.info("All paths found", { startNodeId, endNodeId, pathCount: allPaths.length });
    return allPaths;
  } catch (error) {
    logger.error("Error finding all paths", error);
    throw new ApiError(500, "Failed to find paths");
  }
};

/**
 * Get nodes by level (depth in tree)
 */
export const getNodesByLevel = async (level) => {
  try {
    const nodes = await CareerPathNode.find({
      level,
      status: NODE_STATUS.ACTIVE,
    })
      .select("title slug nodeType description")
      .lean();

    return nodes;
  } catch (error) {
    logger.error("Error fetching nodes by level", error);
    throw new ApiError(500, "Failed to fetch nodes");
  }
};

/**
 * Validate tree structure for circular dependencies
 */
export const validateTreeStructure = async () => {
  try {
    const nodes = await CareerPathNode.find({ status: NODE_STATUS.ACTIVE }).lean();
    const errors = [];

    for (const node of nodes) {
      const visited = new Set();

      const hasCycle = async (nodeId) => {
        if (visited.has(nodeId.toString())) {
          return true;
        }

        visited.add(nodeId.toString());

        const currentNode = await CareerPathNode.findById(nodeId).select("nextNodeIds").lean();
        if (currentNode && currentNode.nextNodeIds) {
          for (const nextId of currentNode.nextNodeIds) {
            if (await hasCycle(nextId)) {
              return true;
            }
          }
        }

        visited.delete(nodeId.toString());
        return false;
      };

      if (await hasCycle(node._id)) {
        errors.push({
          nodeId: node._id,
          nodeTitle: node.title,
          error: "Circular dependency detected",
        });
      }
    }

    logger.info("Tree validation complete", {
      totalNodes: nodes.length,
      errors: errors.length,
    });

    return {
      isValid: errors.length === 0,
      errors,
      totalNodesValidated: nodes.length,
    };
  } catch (error) {
    logger.error("Error validating tree structure", error);
    throw new ApiError(500, "Failed to validate tree structure");
  }
};

/**
 * Get all ancestors of a node
 */
export const getNodeAncestors = async (nodeId) => {
  try {
    const ancestors = [];
    const visited = new Set();

    const traverse = async (id) => {
      if (visited.has(id.toString())) return;
      visited.add(id.toString());

      const nodes = await CareerPathNode.find({
        nextNodeIds: id,
        status: NODE_STATUS.ACTIVE,
      }).lean();

      for (const node of nodes) {
        ancestors.push({
          _id: node._id,
          title: node.title,
          slug: node.slug,
          nodeType: node.nodeType,
        });
        await traverse(node._id);
      }
    };

    await traverse(nodeId);
    return ancestors;
  } catch (error) {
    logger.error("Error fetching node ancestors", error);
    throw new ApiError(500, "Failed to fetch ancestors");
  }
};

/**
 * Get all descendants of a node
 */
export const getNodeDescendants = async (nodeId) => {
  try {
    const descendants = [];
    const visited = new Set();

    const traverse = async (id) => {
      if (visited.has(id.toString())) return;
      visited.add(id.toString());

      const node = await CareerPathNode.findById(id).select("nextNodeIds").lean();
      if (!node) return;

      for (const nextId of node.nextNodeIds || []) {
        const nextNode = await CareerPathNode.findById(nextId)
          .select("title slug nodeType")
          .lean();

        if (nextNode) {
          descendants.push(nextNode);
          await traverse(nextId);
        }
      }
    };

    await traverse(nodeId);
    return descendants;
  } catch (error) {
    logger.error("Error fetching node descendants", error);
    throw new ApiError(500, "Failed to fetch descendants");
  }
};

/**
 * Helper to flatten tree structure
 */
const flattenTree = (tree) => {
  let flat = [];
  const traverse = (nodes) => {
    if (!Array.isArray(nodes)) nodes = [nodes];
    nodes.forEach((node) => {
      if (node) {
        flat.push(node);
        if (node.children) {
          traverse(node.children);
        }
      }
    });
  };
  traverse(tree);
  return flat;
};

export default {
  buildCareerTree,
  getAllPathsBetween,
  getNodesByLevel,
  validateTreeStructure,
  getNodeAncestors,
  getNodeDescendants,
};