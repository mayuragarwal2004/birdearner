/** Keep in sync with api/app/api/jobs/_post.ts createJobSchema */
export const JOB_VALIDATION = {
  jobTitleMin: 5,
  jobDescriptionMin: 20,
  skillMin: 1,
};

export function getJobFormValidationError({
  jobTitle,
  jobDes,
  freelancerType,
  serviceId,
  jobType,
  deadline,
  startDate,
  budget,
  budgetError,
  skills,
  jobLocation,
  latitude,
  longitude,
  validateBudget,
}) {
  const title = (jobTitle || "").trim();
  if (!title) return "Please enter a job title.";
  if (title.length < JOB_VALIDATION.jobTitleMin) {
    return `Job title must be at least ${JOB_VALIDATION.jobTitleMin} characters.`;
  }

  if (!freelancerType || !serviceId) {
    return "Please select a freelancer type.";
  }

  if (!jobType) return "Please select a job type.";

  if (!deadline) return "Please select an end date.";
  if (deadline < new Date()) return "Deadline must be a future date.";
  if (startDate && deadline < startDate) {
    return "End date must be after the start date.";
  }

  if (typeof validateBudget === "function") {
    if (!validateBudget(budget)) {
      return budgetError || "Please enter a valid budget amount.";
    }
  } else {
    const amount = parseFloat(budget);
    if (!budget || Number.isNaN(amount) || amount <= 0) {
      return "Please enter a valid budget amount.";
    }
  }

  const cleanedSkills = (skills || []).map((s) => String(s || "").trim()).filter(Boolean);
  if (!cleanedSkills.length) {
    return "Please enter at least one skill.";
  }
  if ((skills || []).some((skill) => String(skill || "").trim() === "")) {
    return "Please enter all required skills (or remove empty skill fields).";
  }

  const description = (jobDes || "").trim();
  if (!description) return "Please enter a job description.";
  if (description.length < JOB_VALIDATION.jobDescriptionMin) {
    return `Job description must be at least ${JOB_VALIDATION.jobDescriptionMin} characters.`;
  }

  if (jobType === "On-site") {
    if (!jobLocation || !String(jobLocation).trim()) {
      return "Please enter a job location for on-site work.";
    }
    if (!latitude || !longitude) {
      return "Please set the job location on the map (use current location or locate address).";
    }
  }

  return null;
}
