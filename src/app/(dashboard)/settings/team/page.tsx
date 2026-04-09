import { User } from 'lucide-react';

interface TeamMember {
  name: string;
  nickname: string;
  role: string;
  initials: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'ณัฐวัตร จินอยู่ยงค์',
    nickname: 'Nut',
    role: 'Partner / Architect',
    initials: 'NN',
  },
  {
    name: 'สหรัฐ พรศิริพิทักษ์',
    nickname: 'Gun',
    role: 'Partner / Architect',
    initials: 'SP',
  },
  {
    name: 'ชนิสรา ปิยะสุวรรณ',
    nickname: 'Ping',
    role: 'Partner / Architect',
    initials: 'CP',
  },
  {
    name: 'ชนวีร์ เอี่ยมวุฒิกร',
    nickname: 'Yo',
    role: 'Civil Engineer',
    initials: 'CE',
  },
];

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Team Management</h1>
        <p className="text-[13px] text-[#999]">Manage admin users and roles</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM_MEMBERS.map((member) => (
          <div
            key={member.nickname}
            className="flex flex-col items-center gap-4 rounded-lg border border-[#E5E4E2] bg-white p-6 text-center"
          >
            {/* Avatar */}
            <div className="flex size-16 items-center justify-center rounded-full bg-[#F0EFED]">
              <span className="text-[15px] font-semibold text-[#6B6B6B]">
                {member.initials}
              </span>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-0.5">
              <p className="text-[15px] font-semibold text-[#1A1A1A]">
                {member.name}
              </p>
              <p className="text-[13px] text-[#6B6B6B]">
                ({member.nickname})
              </p>
              <span className="mt-1 inline-block rounded-full bg-[#F0EFED] px-3 py-0.5 text-[11px] font-medium text-[#6B6B6B]">
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="flex items-center gap-2 rounded-lg border border-[#E5E4E2] bg-[#FAFAF8] px-4 py-3">
        <User className="size-4 shrink-0 text-[#999]" />
        <p className="text-[13px] text-[#999]">
          Team CRUD management will be available in a future phase.
        </p>
      </div>
    </div>
  );
}
