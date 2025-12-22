import { NextRequest, NextResponse } from 'next/server';
import {
  getAllData,
  importAllData,
  setVisited,
  setNote,
  setDayPlan,
  addCustomActivity,
  removeCustomActivity,
  DayPlanDB,
  CustomActivityDB,
} from '@/lib/db/database';

// GET - Fetch all data from server
export async function GET() {
  try {
    const data = getAllData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sync data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Sync data from client to server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'import': {
        // Full import from client (initial sync)
        importAllData(data);
        return NextResponse.json({ success: true, message: 'Data imported successfully' });
      }

      case 'setVisited': {
        const { locationId, visited } = data;
        setVisited(locationId, visited);
        return NextResponse.json({ success: true });
      }

      case 'setNote': {
        const { locationId, note } = data;
        setNote(locationId, note);
        return NextResponse.json({ success: true });
      }

      case 'setDayPlan': {
        const plan: DayPlanDB = data;
        setDayPlan(plan);
        return NextResponse.json({ success: true });
      }

      case 'addCustomActivity': {
        const activity: CustomActivityDB = data;
        addCustomActivity(activity);
        return NextResponse.json({ success: true });
      }

      case 'removeCustomActivity': {
        const { activityId } = data;
        removeCustomActivity(activityId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing sync request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
