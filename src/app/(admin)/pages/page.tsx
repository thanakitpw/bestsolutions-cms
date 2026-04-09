import Link from "next/link";
export default function PagesPage() {
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-2xl font-bold text-[#1A1A1A]">Website Pages</h1><p className="text-[13px] text-[#999]">Edit content for each page</p></div>
      <div className="grid grid-cols-3 gap-4">
        {["home","about","contact"].map(p=>(
          <Link key={p} href={"/admin/pages/"+p} className="flex flex-col items-center gap-2 rounded-lg border border-[#E5E4E2] bg-white p-8 transition-colors hover:bg-[#FAFAF8]">
            <span className="text-lg font-bold capitalize text-[#1A1A1A]">{p}</span>
            <span className="text-[12px] text-[#999]">Edit {p} page content</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
