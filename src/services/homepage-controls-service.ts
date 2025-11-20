import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type HomepageSectionControl = Database['public']['Tables']['homepage_section_controls']['Row'];
type HomepageSectionUpdate = Database['public']['Tables']['homepage_section_controls']['Update'];

export interface HomepageSectionWithIndex extends HomepageSectionControl {
  index?: number;
}

export async function getHomepageSections(): Promise<HomepageSectionControl[]> {
  const { data, error } = await supabase
    .from('homepage_section_controls')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching homepage sections:', error);
    throw error;
  }

  return data || [];
}

export async function getVisibleHomepageSections(): Promise<HomepageSectionControl[]> {
  const { data, error } = await supabase
    .from('homepage_section_controls')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching visible homepage sections:', error);
    throw error;
  }

  return data || [];
}

export async function updateSectionVisibility(
  sectionId: string,
  isVisible: boolean,
  userId: string
): Promise<HomepageSectionControl> {
  const { data: existingSection } = await supabase
    .from('homepage_section_controls')
    .select('*')
    .eq('id', sectionId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('homepage_section_controls')
    .update({
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating section visibility:', error);
    throw error;
  }

  if (existingSection) {
    await logHomepageControlChange(
      sectionId,
      userId,
      isVisible ? 'section_enabled' : 'section_disabled',
      'is_visible',
      existingSection.is_visible.toString(),
      isVisible.toString()
    );
  }

  return data;
}

export async function updateSectionOrder(
  sections: { id: string; display_order: number }[],
  userId: string
): Promise<void> {
  const updates = sections.map(({ id, display_order }) =>
    supabase
      .from('homepage_section_controls')
      .update({
        display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
  );

  const results = await Promise.allSettled(updates);

  const errors = results.filter((r) => r.status === 'rejected');
  if (errors.length > 0) {
    console.error('Error updating section order:', errors);
    throw new Error('Failed to update section order');
  }

  await logHomepageControlChange(
    'bulk_reorder',
    userId,
    'sections_reordered',
    'display_order',
    null,
    JSON.stringify(sections.map(s => ({ id: s.id, order: s.display_order })))
  );
}

export async function updateSection(
  sectionId: string,
  updates: HomepageSectionUpdate,
  userId: string
): Promise<HomepageSectionControl> {
  const { data: existingSection } = await supabase
    .from('homepage_section_controls')
    .select('*')
    .eq('id', sectionId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('homepage_section_controls')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating section:', error);
    throw error;
  }

  if (existingSection) {
    const changedFields = Object.keys(updates).filter(
      key => key !== 'updated_at'
    );

    for (const field of changedFields) {
      const oldValue = existingSection[field as keyof HomepageSectionControl];
      const newValue = updates[field as keyof HomepageSectionUpdate];

      await logHomepageControlChange(
        sectionId,
        userId,
        'section_updated',
        field,
        typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
        typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
      );
    }
  }

  return data;
}

export async function bulkUpdateSections(
  updates: { id: string; updates: HomepageSectionUpdate }[],
  userId: string
): Promise<void> {
  const promises = updates.map(({ id, updates: sectionUpdates }) =>
    updateSection(id, sectionUpdates, userId)
  );

  await Promise.all(promises);
}

async function logHomepageControlChange(
  sectionId: string,
  userId: string,
  actionType: string,
  fieldChanged: string,
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  const { error } = await supabase
    .from('homepage_control_audit_log')
    .insert({
      section_id: sectionId,
      user_id: userId,
      action_type: actionType,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
    });

  if (error) {
    console.error('Error logging homepage control change:', error);
  }
}

export async function getHomepageControlAuditLog(limit: number = 50) {
  const { data, error } = await supabase
    .from('homepage_control_audit_log')
    .select('*, users!homepage_control_audit_log_user_id_fkey(username, email)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching homepage control audit log:', error);
    throw error;
  }

  return data || [];
}
