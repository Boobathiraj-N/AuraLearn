import { useEffect, useState } from "react";
import authAPI from "../../services/authService";

const CourseFeedbackSection = ({ courseId, studentId }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check whether the student already submitted feedback
  useEffect(() => {
    const checkFeedback = async () => {
      try {
        const response = await authAPI.get(
          `/course-feedback/${courseId}`
        );

        const existingFeedback = response.data.feedbacks.find(
          (feedback) => feedback.student?._id === studentId
        );

        if (existingFeedback) {
          setSubmitted(true);
          setRating(existingFeedback.rating);
          setReview(existingFeedback.review || "");
        }
      } catch (error) {
        setError("Unable to load feedback details.");
      } finally {
        setLoading(false);
      }
    };

    checkFeedback();
  }, [courseId, studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await authAPI.post(`/course-feedback/${courseId}`, {
        rating,
        review,
      });

      setSubmitted(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to submit feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="mt-4 text-sm text-slate-400">Loading feedback...</p>;
  }

  return (
    <div className="mt-5 border-t border-slate-700 pt-4">
      {submitted ? (
        <div>
          <p className="font-medium text-green-400">
            ✓ Feedback submitted successfully!
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Your rating: {"⭐".repeat(rating)}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3 className="mb-3 font-semibold">Rate this course</h3>

          <div className="mb-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl ${
                  star <= rating ? "text-yellow-400" : "text-slate-600"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review (optional)"
            maxLength={1000}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-blue-500"
          />

          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      )}

      {!submitted && error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default CourseFeedbackSection;