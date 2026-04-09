import { Building2 } from 'lucide-react'

export function SelectTenantPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Building2 className="h-12 w-12 opacity-30" />
      <p className="text-lg font-medium text-foreground">เลือก Tenant เพื่อเริ่มต้น</p>
      <p className="text-sm">ใช้ Tenant Switcher ในแถบซ้ายมือเพื่อเลือก tenant ที่ต้องการจัดการ</p>
    </div>
  )
}
