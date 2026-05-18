import {Link, Tabs} from "@heroui/react";

export function SideBar() {
  return (
    <Tabs orientation="vertical">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Vertical tabs">
          <Tabs.Tab id="account">
            <Link href="/" className="no-underline">Home</Link>
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="security">
            <Link href="/settings" className="no-underline">Settings</Link>
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}