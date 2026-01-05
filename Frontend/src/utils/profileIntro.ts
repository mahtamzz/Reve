import type { ApiGroup, StudySubject } from "@/api/types";

export function generateProfileIntroduction(params: {
  displayName?: string | null;
  groups?: ApiGroup[];
  subjects?: StudySubject[];
  weeklyGoal?: number | null;
}) {
  const {
    displayName,
    groups = [],
    subjects = [],
    weeklyGoal,
  } = params;

  const name = displayName?.trim() || "This user";

  const groupCount = groups.length;
  const subjectCount = subjects.length;

  const topGroups = groups
    .filter((g) => g?.name)
    .slice(0, 2)
    .map((g) => g.name);

  const topSubjects = subjects
    .filter((s) => s?.name)
    .slice(0, 3)
    .map((s) => s.name);

  const parts: string[] = [];

  parts.push(`${name} is focused on consistent and intentional study.`);

  if (groupCount > 0) {
    parts.push(
      groupCount === 1
        ? `Member of one study group${topGroups[0] ? ` (${topGroups[0]})` : ""}.`
        : `Member of ${groupCount} study groups, including ${topGroups.join(" and ")}.`
    );
  } else {
    parts.push(`Not currently part of any study group.`);
  }

  if (subjectCount > 0) {
    parts.push(`Currently studying ${topSubjects.join(", ")}.`);
  }

  if (typeof weeklyGoal === "number") {
    parts.push(`Weekly study goal: ${weeklyGoal} minutes.`);
  }

  return parts.join(" ");
}
