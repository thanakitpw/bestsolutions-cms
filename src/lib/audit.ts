import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId: string,
  tenantId: string | null,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    await supabase.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      tenant_id: tenantId,
      user_id: userId ?? null,
      metadata: metadata ?? null,
    })
  } catch (err) {
    console.error('[Audit] Failed to log event:', err)
    // ไม่ re-throw — audit failure ไม่กระทบ main flow
  }
}
