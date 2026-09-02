
import { useState, useEffect } from 'react';
import DocumentCard from '../components/DocumentCard';

function Dashboard() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://127.0.0.1:8000/documents', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('DOCUMENTS FROM BACKEND:', data);
        setDocuments(data);
      })
      .catch((error) => {
        console.error('Error fetching documents:', error);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">
        My Documents
      </h1>

      {documents.map((doc) => {
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
      })}
    </div>
  );
}

export default Dashboard;

