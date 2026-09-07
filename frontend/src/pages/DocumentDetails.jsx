
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';

function DocumentDetails() {
  console.log("DOCUMENT DETAILS RENDERED");

  const { id } = useParams();

  const [document, setDocument] = useState(null);

  // Step 6: signer email and signing link
  const [signerEmail, setSignerEmail] = useState('');
  const [signingLink, setSigningLink] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:8000/documents/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setDocument(data));
  }, [id]);

  // Send document for signature
  async function handleSendForSignature(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/documents/${id}/signing-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            signer_email: signerEmail,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        console.log('Signing request sent successfully');

        // Display signing link returned by backend
        setSigningLink(data.signing_link);
      } else {
        console.log('Submission failed:', data);
      }
    } catch (error) {
      console.log('Error sending signing request:', error);
    }
  }

  if (!document) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10">

      {/* Document title */}
      <h1 className="text-2xl font-bold">
        {document.title}
      </h1>

      {/* Document status */}
      <p className="text-gray-500 mb-4">
        Status: {document.status}
      </p>

      {/* PDF */}
      <iframe
        src={`http://127.0.0.1:8000/documents/${id}/file`}
        className="w-full h-[600px] border rounded"
        title="Document PDF"
      />

      {/* Send for Signature */}
      <div className="mt-8 border rounded-lg p-6">

        <h2 className="text-xl font-bold mb-4">
          Send for Signature
        </h2>

        <form
          onSubmit={handleSendForSignature}
          className="flex flex-col gap-4"
        >

          <input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="Enter signer's email"
            required
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send for Signature
          </button>

        </form>

        {/* Signing link */}
        {signingLink && (
          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded">

            <p className="font-semibold mb-2">
              Signing link:
            </p>

            <p className="break-all text-blue-600">
              {signingLink}
            </p>

          </div>
        )}

      </div>

      {/* Signature section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">
          Sign Document
        </h2>

        <SignaturePad />
      </div>

    </div>
  );
}

export default DocumentDetails;


