
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  CalendarDays,
  CreditCard,
  Receipt,
  Loader2,
  BookOpen,
} from "lucide-react";
import { getMyPurchases } from "../../services/paymentService";

const MyPurchases = () => {
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await getMyPurchases();
        setPurchases(response.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your purchases"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPaymentMethod = (method) => {
    if (!method) return "Not available";

    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/student")}
            className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Courses
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <ShoppingBag size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                My Purchases
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                View your course purchase history and payment details
              </p>
            </div>
          </div>
        </div>

        {/* Purchase Count */}
        {!loading && !error && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-[#18181b] p-5">
            <p className="text-sm text-gray-400">Total Purchases</p>
            <p className="mt-2 text-3xl font-bold text-violet-400">
              {purchases.length}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="animate-spin text-violet-500" size={36} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && purchases.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#18181b] px-6 py-16 text-center">
            <ShoppingBag
              size={48}
              className="mx-auto mb-4 text-gray-600"
            />

            <h2 className="text-xl font-semibold">
              No Purchases Yet
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Your purchased courses will appear here.
            </p>

            <button
              onClick={() => navigate("/student")}
              className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold transition hover:bg-violet-700"
            >
              Explore Courses
            </button>
          </div>
        )}

        {/* Purchase List */}
        {!loading && !error && purchases.length > 0 && (
          <div className="space-y-5">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] transition hover:border-violet-500/30"
              >
                <div className="flex flex-col gap-5 p-5 sm:flex-row">

                  {/* Course Image */}
                  <div className="h-44 w-full shrink-0 overflow-hidden rounded-xl bg-[#27272a] sm:h-32 sm:w-52">
                    {purchase.course?.thumbnail ? (
                      <img
                        src={purchase.course.thumbnail}
                        alt={purchase.course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        <BookOpen size={36} />
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {purchase.course?.title || "Course unavailable"}
                        </h2>

                        <p className="mt-2 text-2xl font-bold text-violet-400">
                          ₹{purchase.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                        Payment Successful
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">

                      <div className="flex items-start gap-3">
                        <CalendarDays
                          size={18}
                          className="mt-0.5 text-gray-500"
                        />
                        <div>
                          <p className="text-xs text-gray-500">
                            Purchase Date
                          </p>
                          <p className="mt-1 text-sm text-gray-300">
                            {formatDate(purchase.purchaseDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CreditCard
                          size={18}
                          className="mt-0.5 text-gray-500"
                        />
                        <div>
                          <p className="text-xs text-gray-500">
                            Payment Method
                          </p>
                          <p className="mt-1 text-sm text-gray-300">
                            {formatPaymentMethod(purchase.paymentMethod)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Receipt
                          size={18}
                          className="mt-0.5 text-gray-500"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">
                            Payment ID
                          </p>
                          <p className="mt-1 break-all text-sm text-gray-300">
                            {purchase.paymentId || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Receipt
                          size={18}
                          className="mt-0.5 text-gray-500"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">
                            Order ID
                          </p>
                          <p className="mt-1 break-all text-sm text-gray-300">
                            {purchase.orderId || "N/A"}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
