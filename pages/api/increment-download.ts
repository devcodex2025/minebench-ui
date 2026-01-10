import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Використовуємо анонімний ключ замість service role, оскільки RLS політики дозволяють публічний update
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.body; // 'cpu' or 'gpu'

    if (!type || !['cpu', 'gpu'].includes(type)) {
      return res.status(400).json({ error: 'Invalid download type' });
    }

    // Отримуємо поточну статистику
    const { data: currentStats, error: fetchError } = await supabase
      .from('global_stats')
      .select('*')
      .eq('id', 1)
      .single();

    if (fetchError) {
      console.error('Error fetching stats:', fetchError);
      // Якщо таблиця не існує або немає даних, повертаємо success але логуємо помилку
      return res.status(200).json({ 
        success: false, 
        message: 'Stats table not initialized. Please run the migration first.',
        error: fetchError.message 
      });
    }

    // Інкрементуємо відповідні лічильники
    const updates = {
      total_downloads: currentStats.total_downloads + 1,
      cpu_downloads: type === 'cpu' ? currentStats.cpu_downloads + 1 : currentStats.cpu_downloads,
      gpu_downloads: type === 'gpu' ? currentStats.gpu_downloads + 1 : currentStats.gpu_downloads,
    };

    const { data, error } = await supabase
      .from('global_stats')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      console.error('Error updating stats:', error);
      return res.status(200).json({ 
        success: false, 
        message: 'Failed to update stats',
        error: error.message 
      });
    }

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    res.status(200).json({ 
      success: false, 
      message: 'Unexpected error occurred',
      error: err.message 
    });
  }
}
