import { useState, useEffect } from 'react';
import DocumentCard from '../components/DocumentCard';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Error state for fetching documents
  const [error, setError] = useState(null);

  // =========================================================
  // FETCH DOCUMENTS
  // =========================================================

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

      // fetch() does not automatically throw for
      // 401, 404, 500 etc.
      // So we manually check response.ok.

      if (!response.ok) {
        throw new Error(
          `Failed to fetch documents: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        'DOCUMENTS FROM BACKEND:',
        data
      );

      setDocuments(data);

      // Clear previous error if request succeeds
      setError(null);

    } catch (error) {
      console.error(
        'Error fetching documents:',
        error
      );

      setError(error.message);
    }
  };


  // =========================================================
  // FETCH DOCUMENTS WHEN PAGE LOADS
  // =========================================================

  useEffect(() => {
    fetchDocuments();
  }, []);


  // =========================================================
  // HANDLE FILE SELECTION
  // =========================================================

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Check PDF extension
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed.');

      // Clear selected file
      e.target.value = '';
      setSelectedFile(null);

      return;
    }

    setSelectedFile(file);
  };


  // =========================================================
  // HANDLE UPLOAD
  // =========================================================

  const handleUpload = async () => {

    // Guard clause
    // This prevents upload if no file is selected.

    if (!selectedFile) {
      alert('Please select a PDF first.');
      return;
    }


    // Extra PDF check

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed.');
      return;
    }


    const token = localStorage.getItem('token');

    const formData = new FormData();

    formData.append(
      'file',
      selectedFile
    );


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


      // =====================================================
      // SUCCESS
      // =====================================================

      if (response.ok) {

        console.log(
          'UPLOAD SUCCESSFUL:',
          data
        );


        alert(
          'PDF uploaded successfully!'
        );


        // Clear selected file

        setSelectedFile(null);


        // Refresh document list

        await fetchDocuments();


      } else {

        // ===================================================
        // BACKEND ERROR
        // ===================================================

        console.log(
          'UPLOAD FAILED:',
          data
        );


        alert(
          data.detail ||
          'Upload failed'
        );
      }


    } catch (error) {

      // =====================================================
      // NETWORK / SERVER ERROR
      // =====================================================

      console.error(
        'Error uploading document:',
        error
      );


      alert(
        'Unable to connect to server'
      );


    } finally {

      // Always stop loading

      setUploading(false);
    }
  };


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col gap-6">

      {/* =====================================================
          PAGE TITLE
      ===================================================== */}

      <h1 className="text-2xl font-bold">
        My Documents
      </h1>


      {/* =====================================================
          UPLOAD SECTION
      ===================================================== */}

      <div className="border rounded-lg p-5">

        <h2 className="text-lg font-semibold mb-3">
          Upload Document
        </h2>


        {/* =================================================
            FILE INPUT
        ================================================= */}

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="border p-2 rounded w-full"
        />


        {/* =================================================
            SELECTED FILE
        ================================================= */}

        {selectedFile && (
          <p className="text-sm mt-2">
            Selected: {selectedFile.name}
          </p>
        )}


        {/* =================================================
            UPLOAD BUTTON
        ================================================= */}

        <button
          onClick={handleUpload}

          // Disable when:
          // 1. No file is selected
          // 2. Upload is already in progress

          disabled={
            !selectedFile ||
            uploading
          }

          className="
            mt-4
            bg-blue-600
            text-white
            px-4
            py-2
            rounded
            hover:bg-blue-700
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          {uploading
            ? 'Uploading...'
            : 'Upload PDF'}
        </button>

      </div>


      {/* =====================================================
          DOCUMENT FETCH ERROR
      ===================================================== */}

      {error && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4">

          <p className="text-red-600">
            {error}
          </p>

        </div>
      )}


      {/* =====================================================
          DOCUMENTS
      ===================================================== */}

      {!error && (
        <div className="flex flex-col gap-4">

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {documents.length === 0 ? (

            <p className="text-gray-500">
              No documents uploaded yet.
            </p>

          ) : (

            /* ===============================================
               DOCUMENT LIST
            =============================================== */

            documents.map((doc) => {

              console.log(
                'DOCUMENT:',
                doc
              );


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
      )}

    </div>
  );
}

export default Dashboard;