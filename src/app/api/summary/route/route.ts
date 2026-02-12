import { getDashboardSummary } from '../../lib/dashboard-data';

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        success: true,
        data: summary,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        success: false,
        error: 'Failed to fetch dashboard summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}