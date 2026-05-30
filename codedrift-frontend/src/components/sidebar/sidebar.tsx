/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

const Sidebar = (): JSX.Element => {
  return (
    <div className="min-w-[300px] max-w-[300px] pl-4 pr-3 pt-4 pb-3 flex bg-white rounded shadow-md">
      <div className={`overflow-auto ${THIN_SCROLLBAR_CLASS}`}>
        <div className="text-justify">
          Sidebar
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
