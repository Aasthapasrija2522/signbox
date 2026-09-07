
import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState
} from 'react';

const SignaturePad = forwardRef((props, ref) => {
    console.log("SIGNATURE PAD RENDERED");

    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Get canvas 2D context
    function getContext() {
        const canvas = canvasRef.current;
        return canvas.getContext('2d');
    }

    // Start drawing
    function startDrawing(e) {
        const canvas = canvasRef.current;
        const ctx = getContext();

        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();

        ctx.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );

        setIsDrawing(true);
    }

    // Draw
    function draw(e) {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = getContext();

        const rect = canvas.getBoundingClientRect();

        ctx.lineTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.stroke();
    }

    // Stop drawing
    function stopDrawing() {
        setIsDrawing(false);
    }

    // Clear canvas
    function clearCanvas() {
        const canvas = canvasRef.current;
        const ctx = getContext();

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        console.log("CANVAS CLEARED");
    }

    // Get signature as Base64 PNG
    function getSignatureData() {
        const canvas = canvasRef.current;

        const signatureData = canvas.toDataURL('image/png');

        console.log("SIGNATURE DATA:");
        console.log(signatureData);

        return signatureData;
    }

    // Touch start
    function handleTouchStart(e) {
        e.preventDefault();

        const touch = e.touches[0];

        startDrawing({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    // Touch move
    function handleTouchMove(e) {
        e.preventDefault();

        const touch = e.touches[0];

        draw({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    // Touch end
    function handleTouchEnd(e) {
        e.preventDefault();

        stopDrawing();
    }

    // Expose selected functions to the parent component
    useImperativeHandle(ref, () => ({
        getSignatureData,
        clearCanvas
    }));

    return (
        <div className="flex flex-col items-start">

            <h2 className="text-lg font-semibold mb-2">
                Sign Here
            </h2>

            <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border-2 border-gray-400 rounded bg-white"
                style={{
                    touchAction: 'none',
                    cursor: 'crosshair'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            <div className="mt-3 flex gap-3">

                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 border border-gray-400 rounded"
                >
                    Clear
                </button>

            </div>

        </div>
    );
});

export default SignaturePad;

