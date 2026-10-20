export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Optional: Add a simple header for customers here if needed */}
            {children}
        </div>
    );
}
