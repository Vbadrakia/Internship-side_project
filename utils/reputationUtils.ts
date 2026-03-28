import { Application, ApplicationStatus, ReputationStats } from '../types';

export const calculateReputation = (applications: Application[]): ReputationStats => {
  const total = applications.length;
  if (total === 0) {
    return {
      responseRate: 0,
      avgResponseTimeDays: 0,
      totalApplications: 0,
      totalResponded: 0,
      feedbackQualityScore: 0,
      tier: 'New'
    };
  }

  const respondedApps = applications.filter(app => app.status !== ApplicationStatus.APPLIED);
  const respondedCount = respondedApps.length;
  const responseRate = (respondedCount / total) * 100;

  let totalResponseTimeMs = 0;
  let responseTimesCount = 0;

  respondedApps.forEach(app => {
    if (app.lastStatusUpdateAt) {
      const applied = new Date(app.appliedAt).getTime();
      const responded = new Date(app.lastStatusUpdateAt).getTime();
      const diff = responded - applied;
      if (diff > 0) {
        totalResponseTimeMs += diff;
        responseTimesCount++;
      }
    }
  });

  const avgResponseTimeDays = responseTimesCount > 0 
    ? (totalResponseTimeMs / responseTimesCount) / (1000 * 60 * 60 * 24)
    : 0;

  const ratedApps = applications.filter(app => app.feedbackRating !== undefined);
  const feedbackQualityScore = ratedApps.length > 0
    ? ratedApps.reduce((acc, app) => acc + (app.feedbackRating || 0), 0) / ratedApps.length
    : 0;

  let tier: ReputationStats['tier'] = 'New';
  if (total > 5) {
    if (responseRate >= 95 && avgResponseTimeDays <= 3 && feedbackQualityScore >= 4) tier = 'Elite';
    else if (responseRate >= 85 && feedbackQualityScore >= 3.5) tier = 'Consistent';
    else if (responseRate >= 70) tier = 'Responsive';
  }

  return {
    responseRate,
    avgResponseTimeDays,
    totalApplications: total,
    totalResponded: respondedCount,
    feedbackQualityScore,
    tier
  };
};