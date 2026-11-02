import { getCampaignsWithStaffAction } from '../../campaign-actions';
import { CampaignsDashboard } from './campaigns-dashboard';

export const revalidate = 0;

export default async function CampaignsPage() {
  const data = await getCampaignsWithStaffAction();

  return (
    <CampaignsDashboard
      initialCampaigns={data.campaigns}
      initialUnassignedStaff={data.unassignedStaff}
      totalStaffCount={data.totalStaffCount}
    />
  );
}
