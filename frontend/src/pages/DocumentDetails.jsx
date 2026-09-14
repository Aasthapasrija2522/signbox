import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function DocumentDetails() {
  console.log('DOCUMENT DETAILS RENDERED');

  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  const [signerEmail, setSignerEmail] = useState('');
  const [signingLink, setSigningLink] = useState('');

  // =========================================================
  // FETCH DOCUMENT DETAILS
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchDocument = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/documents/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // fetch() does not automatically throw for 401, 404, 500
        // So we manually check response.ok
        if (!response.ok) {
          throw new Error(
            `Failed to fetch document: ${response.status}`
          );
        }

        const data = await response.json();

        console.log('DOCUMENT:', data);

        setDocument(data);

      } catch (error) {
        console.error(
          'Error fetching document:',
          error
        );

        // Store error so it can be displayed on the page
        setError(error.message);
      }
    };

    fetchDocument();

  }, [id]);


  // =========================================================
  // FETCH PDF
  // =========================================================

  useEffect(() => {
    if (!document) {
      return;
    }

    const token = localStorage.getItem('token');

    const fetchPdf = async () => {
      try {

        // Clear previous PDF error
        setPdfError(null);

        // If document is signed,
        // load the signed PDF.
        //
        // Otherwise,
        // load the original PDF.

        const pdfEndpoint =
          document.status === 'Signed'
            ? `http://127.0.0.1:8000/documents/${id}/signed-file`
            : `http://127.0.0.1:8000/documents/${id}/file`;

        console.log(
          'PDF ENDPOINT:',
          pdfEndpoint
        );

        const response = await fetch(
          pdfEndpoint,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `PDF request failed: ${response.status} ${errorText}`
          );
        }

        const blob =
          await response.blob();

        console.log(
          'PDF TYPE:',
          blob.type
        );

        console.log(
          'PDF SIZE:',
          blob.size
        );

        const url =
          URL.createObjectURL(blob);

        setPdfUrl(url);

      } catch (error) {
        console.error(
          'Error loading PDF:',
          error
        );

        // Store PDF-specific error
        setPdfError(error.message);
      }
    };

    fetchPdf();

  }, [id, document]);


  // =========================================================
  // SEND DOCUMENT FOR SIGNATURE
  // =========================================================

  async function handleSendForSignature(e) {
    e.preventDefault();

    const token =
      localStorage.getItem('token');

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/documents/${id}/signing-request`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            signer_email:
              signerEmail,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {

        console.log(
          'Signing request sent successfully'
        );

        setSigningLink(
          data.signing_link
        );

        alert(
          'Signing request created successfully!'
        );

      } else {

        console.log(
          'Submission failed:',
          data
        );

        alert(
          data.detail ||
          'Failed to create signing request'
        );
      }

    } catch (error) {

      console.error(
        'Error sending signing request:',
        error
      );

      alert(
        'Unable to connect to server'
      );
    }
  }


  // =========================================================
  // DOCUMENT ERROR
  // =========================================================

  // IMPORTANT:
  // Error check comes BEFORE loading check.
  //
  // When an error happens:
  // document is still null
  // error contains the error message
  //
  // Therefore we must check error first.

  if (error) {
    return (
      <p className="text-red-600 text-center mt-20">
        {error}
      </p>
    );
  }


  // =========================================================
  // LOADING DOCUMENT
  // =========================================================

  if (!document) {
    return (
      <p className="text-center mt-20">
        Loading...
      </p>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="max-w-3xl mx-auto mt-10">

      {/* =====================================================
          DOCUMENT TITLE
      ===================================================== */}

      <h1 className="text-2xl font-bold">
        {document.title}
      </h1>


      {/* =====================================================
          STATUS
      ===================================================== */}

      <p className="text-gray-500 mb-4">
        Status: {document.status}
      </p>
      {document.status === 'Signed' && (
        <a
          href={`http://127.0.0.1:8000/documents/${id}/signed-file?token=${localStorage.getItem('token')}`}
          className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download Signed PDF
        </a>
      )}


      {/* =====================================================
          PDF PREVIEW
      ===================================================== */}

      <div className="mb-6">

        <h2 className="text-lg font-semibold mb-2">
          Document Preview
        </h2>


        {/* PDF ERROR */}

        {pdfError ? (

          <div className="w-full h-[600px] border rounded flex items-center justify-center">

            <p className="text-red-600 text-center px-4">
              {pdfError}
            </p>

          </div>


        ) : pdfUrl ? (

          /* PDF LOADED */

          <iframe
            src={pdfUrl}
            className="w-full h-[600px] border rounded"
            title="Document PDF"
          />


        ) : (

          /* PDF LOADING */

          <div className="w-full h-[600px] border rounded flex items-center justify-center">

            <p className="text-gray-500">
              Loading PDF...
            </p>

          </div>

        )}

      </div>


      {/* =====================================================
          SEND FOR SIGNATURE
      ===================================================== */}

      <div className="mt-8 border rounded-lg p-6">

        <h2 className="text-xl font-bold mb-4">
          Send for Signature
        </h2>


        <form
          onSubmit={handleSendForSignature}
          className="flex flex-col gap-4"
        >

          {/* SIGNER EMAIL */}

          <input
            type="email"
            value={signerEmail}
            onChange={(e) =>
              setSignerEmail(
                e.target.value
              )
            }
            placeholder="Enter signer's email"
            required
            className="border p-2 rounded"
          />


          {/* SEND BUTTON */}

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send for Signature
          </button>

        </form>


        {/* ===================================================
            SIGNING LINK
        =================================================== */}

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

    </div>
  );
}

export default DocumentDetails;