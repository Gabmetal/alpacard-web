"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { verifyAndAddStamp } from "../../../../actions/scan";
import { Loader2 } from "lucide-react";

export default function ScannerPage() {
    const [result, setResult] = useState<{ success: boolean; message: string; newCount?: number } | null>(null);
    const [scanning, setScanning] = useState(true);
    const [processing, setProcessing] = useState(false);

    const handleScan = async (uploadedFiles: unknown[]) => {
        // The library returns an array of results or a single result depending on version.
        // We expect a string or object with rawValue.

        // For @yudiel/react-qr-scanner v2 (latest), onScan returns `(result: IDetectedBarcode[])`.
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        const token = (uploadedFiles[0] as { rawValue: string }).rawValue;
        if (!token || processing) return;

        setProcessing(true);
        setScanning(false); // Pause scanning

        try {
            const res = await verifyAndAddStamp(token);
            setResult(res);
        } catch {
            setResult({ success: false, message: "Error processing scan" });
        } finally {
            setProcessing(false);
        }
    };

    const resetScan = () => {
        setResult(null);
        setScanning(true);
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Scanner
                    </h2>
                </div>
            </div>

            <div className="bg-black rounded-lg overflow-hidden relative shadow-xl aspect-square">
                {scanning && (
                    <Scanner
                        onScan={handleScan}
                        formats={["qr_code"]}
                        components={{
                            onOff: true,
                            torch: true,
                            zoom: true,
                        }}
                    />
                )}

                {!scanning && !processing && !result && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        Camera Paused
                    </div>
                )}

                {processing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-2" />
                        <p>Verifying stamp...</p>
                    </div>
                )}

                {result && (
                    <div className={`absolute inset-0 ${result.success ? "bg-green-600" : "bg-red-600"} flex flex-col items-center justify-center text-white z-20 p-6 text-center`}>
                        {result.success ? (
                            <>
                                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <h3 className="text-2xl font-bold mb-2">Success!</h3>
                                <p className="text-lg">{result.message}</p>
                                {result.newCount !== undefined && (
                                    <p className="text-3xl font-bold mt-4">{result.newCount} Stamps</p>
                                )}
                            </>
                        ) : (
                            <>
                                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <h3 className="text-2xl font-bold mb-2">Error</h3>
                                <p className="text-lg">{result.message}</p>
                            </>
                        )}

                        <button
                            onClick={resetScan}
                            className="mt-8 bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition"
                        >
                            Scan Next
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
                Point the camera at a customer&apos;s loyalty card QR code.
            </div>
        </div>
    );
}
