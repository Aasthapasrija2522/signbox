import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';

function SigningPage() {
  const { token } = useParams();

  const [info, setInfo] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Track whether user has drawn a signature
  const [hasSignature, setHasSignature] = useState(false);

  // Error state for fetching signing information
  const [error, setError] = useState(null);

  // Error state for submitting signature
  const [submitError, setSubmitError] = useState(null);

  const padRef = useRef(null);


  // =========================================================
  // FETCH SIGNING INFORMATION
  // =========================================================

  useEffect(() => {
    const fetchSigningInfo = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/sign/${token}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load signing page: ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          'SIGNING INFO:',
          data
        );

        setInfo(data);

      } catch (error) {
        console.error(
          'Error fetching signing information:',
          error
        );

        setError(error.message);
      }
    };

    fetchSigningInfo();

  }, [token]);


  // =========================================================
  // SUBMIT SIGNATURE
  // =========================================================

  async function handleSubmit() {

    // Guard clause
    if (!hasSignature) {
      setSubmitError(
        'Please draw your signature before submitting.'
      );
      return;
    }

    // Clear previous submit error
    setSubmitError(null);

    try {

      const imageData =
        padRef.current.getSignatureData();

      const res = await fetch(
        `http://127.0.0.1:8000/sign/${token}`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            image_data: imageData,
          }),
        }
      );


      // Check if signature submission was successful

      if (!res.ok) {

        let errorMessage =
          `Signature submission failed: ${res.status}`;

        try {
          const data = await res.json();

          if (data.detail) {
            errorMessage = data.detail;
          }

        } catch {
          // Response was not JSON
        }

        throw new Error(errorMessage);
      }


      // Signature submitted successfully

      console.log(
        'SIGNATURE SUBMITTED SUCCESSFULLY'
      );

      setSubmitted(true);

    } catch (error) {

      console.error(
        'Error submitting signature:',
        error
      );

      setSubmitError(error.message);
    }
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (!info && !error) {
    return (
      <p className="text-center mt-20">
        Loading...
      </p>
    );
  }


  // =========================================================
  // FETCH ERROR
  // =========================================================

  if (error) {
    return (
      <p className="text-red-600 text-center mt-20">
        {error}
      </p>
    );
  }


  // =========================================================
  // SUCCESS
  // =========================================================

  if (submitted) {
    return (
      <p className="text-center mt-20 text-xl">
        Thank you — document signed!
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
        {info.document_title}
      </h1>


      {/* =====================================================
          DOCUMENT PREVIEW
      ===================================================== */}

      <iframe
        src={`http://127.0.0.1:8000/sign/${token}/file`}
        className="w-full h-[500px] border rounded my-4"
        title="Document to sign"
      />


      {/* =====================================================
          SIGNATURE
      ===================================================== */}

      <h2 className="font-semibold">
        Draw your signature below
      </h2>

      <SignaturePad
        ref={padRef}
        onSignatureChange={setHasSignature}
      />


      {/* =====================================================
          SUBMIT ERROR
      ===================================================== */}

      {submitError && (
        <p className="text-red-600 mt-4">
          {submitError}
        </p>
      )}


      {/* =====================================================
          SUBMIT BUTTON
      ===================================================== */}

      <button
        onClick={handleSubmit}
        disabled={!hasSignature}
        className="
          mt-4
          bg-green-600
          text-white
          px-4
          py-2
          rounded
          hover:bg-green-700
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        {hasSignature
          ? 'Submit Signature'
          : 'Draw Signature First'}
      </button>

    </div>
  );
}

export default SigningPage;