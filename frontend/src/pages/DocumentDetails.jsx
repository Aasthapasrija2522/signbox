import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';

function DocumentDetails() {
  console.log("DOCUMENT DETAILS RENDERED");

  const { id } = useParams();
  const [document, setDocument] = useState(null);

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