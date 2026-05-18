'use client'
import KanbanBoard from "@/components/kanban-board";
import {Key, Tabs} from "@heroui/react";
import { useState } from "react";

export default function SwitchNote() {
  const [activeTab, setActiveTab] = useState<Key>("note");

  return (
    <div className="flex flex-col flex-1 items-center gap-5">
      <Tabs className="w-full max-w-md" variant="secondary" onSelectionChange={(key: Key) => setActiveTab(key)}>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Options">
          <Tabs.Tab id="note">
              Note
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="kanban">
            Kanban board
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
    {
      activeTab === "note" ? <></> : <KanbanBoard />
    }
    </div>
  );
}
