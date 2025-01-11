import Header from "@/components/common/Header";

const RootLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-jetbrains">
      <Header />
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default RootLayout;
