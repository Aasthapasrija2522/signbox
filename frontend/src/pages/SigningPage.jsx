
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';

function SigningPage() {
    const { token } = useParams();

    const [info, setInfo] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const padRef = useRef(null);

    // Get document information
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/sign/${token}`)
            .then((res) => res.json())
            .then((data) => {
                setInfo(data);
            })
            .catch((error) => {
                console.log('Error fetching document:', error);
            });
    }, [token]);

    // Submit signature
    async function handleSubmit() {
        try {
            // Get Base64 signature from SignaturePad
            const imageData = padRef.current.getSignatureData();

            console.log('Sending signature...');

            const res = await fetch(
                `http://127.0.0.1:8000/sign/${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image_data: imageData
                    })
                }
            );

            if (res.ok) {
                console.log('Signature submitted successfully');
                setSubmitted(true);
            } else {
                console.log('Submission failed');
            }
        } catch (error) {
            console.log('Error submitting signature:', error);
        }
    }

    // Loading state
    if (!info) {
        return (
            <p className="text-center mt-20">
                Loading...
            </p>
        );
    }

    // Success state
    if (submitted) {
        return (
            <p className="text-center mt-20 text-xl">
                Thank you — document signed!
            </p>
        );
    }

    // Signing page
    return (
        <div className="max-w-3xl mx-auto mt-10">

            <h1 className="text-2xl font-bold">
                {info.document_title}
            </h1>

            <iframe
                src={`http://127.0.0.1:8000/sign/${token}/file`}
                className="w-full h-[500px] border rounded my-4"
                title="Document to sign"
            />

            <h2 className="font-semibold mb-2">
                Draw your signature below
            </h2>

            <SignaturePad ref={padRef} />

            <button
                onClick={handleSubmit}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
                Submit Signature
            </button>

        </div>
    );
}

export default SigningPage;

