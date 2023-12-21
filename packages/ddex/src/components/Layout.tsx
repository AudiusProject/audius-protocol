import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex">
      <main className="flex-grow p-4">{children}</main>
    </div>
  );
};

export default Layout;
