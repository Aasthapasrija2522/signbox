
import { useState, useEffect } from 'react';
import DocumentCard from '../components/DocumentCard';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/documents',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log('DOCUMENTS FROM BACKEND:', data);
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF first.');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed.');
      return;
    }

    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/documents/upload',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('UPLOAD SUCCESSFUL:', data);

        alert('PDF uploaded successfully!');

        setSelectedFile(null);

        await fetchDocuments();
      } else {
        console.log('UPLOAD FAILED:', data);
        alert(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Unable to connect to server');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col gap-6">

      <h1 className="text-2xl font-bold">
        My Documents
      </h1>

      {/* Upload Section */}
      <div className="border rounded-lg p-5">

        <h2 className="text-lg font-semibold mb-3">
          Upload Document
        </h2>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="border p-2 rounded w-full"
        />

        {selectedFile && (
          <p className="text-sm mt-2">
            Selected: {selectedFile.name}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>

      </div>

      {/* Documents */}
      <div className="flex flex-col gap-4">

        {documents.length === 0 ? (
          <p className="text-gray-500">
            No documents uploaded yet.
          </p>
        ) : (
          documents.map((doc) => {

            console.log('DOCUMENT:', doc);

            return (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                status={doc.status}
                uploadedAt={doc.created_at}
              />
            );
          })
        )}

      </div>

    </div>
  );
}

export default Dashboard;

