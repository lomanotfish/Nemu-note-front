import { Tabs } from "@heroui/react";

export default function SettingsSidebar({ children }: { children: React.ReactNode }) {
    return (
        <div className="ms-3 flex p-4">
            <div className="flex flex-col gap-2">
                <h1>Settings</h1>
                <Tabs className="w-full max-w-lg" orientation="vertical" variant="secondary">
                    <Tabs.ListContainer>
                        <Tabs.List aria-label="Vertical tabs">
                            <Tabs.Tab id="account">
                                Tags management
                                <Tabs.Indicator />
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>
            </div>
            {children}
        </div>
    );
}