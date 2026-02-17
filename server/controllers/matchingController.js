import { findMatchingTeachers, findMatchingSkills } from '../services/matchingService.js';

export const getMatchingTeachers = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const matches = await findMatchingTeachers(skillId);
    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

export const getMatchingSkills = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const matches = await findMatchingSkills(requestId);
    res.json({ matches });
  } catch (error) {
    next(error);
  }
};
