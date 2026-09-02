import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function DocumentDetails() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://127.0.0.1:8000/documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setDocument(data));
  }, [id]);
    if (!document) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-2xl font-bold">{document.title}</h1>
      <p className="text-gray-500 mb-4">Status: {document.status}</p>
      <iframe
        src={`http://127.0.0.1:8000/documents/${id}/file`}
        className="w-full h-[600px] border rounded"
        title="Document PDF"
      />
    </div>
  );
}

export default DocumentDetails;