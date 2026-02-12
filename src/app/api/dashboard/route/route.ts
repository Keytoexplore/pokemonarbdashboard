import { generateDashboardData } from '../../lib/dashboard-data';

export async function GET() {
  try {
    const dashboardData = await generateDashboardData();
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        success: true,
        data: dashboardData,
        count: dashboardData.length,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}