import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function TourReviews() {
    // Mock data based on the image provided
    const reviews = [
        {
            name: "Ruxandra",
            country: "Poland",
            date: "January 5, 2026",
            rating: 5,
            text: "It was an amazing experience and an induction into Agra and Taj Mahal history! I strongly recommend this tour!",
            initial: "R",
            color: "bg-orange-500"
        },
        {
            name: "Martin",
            country: "United States",
            date: "December 28, 2025",
            rating: 5,
            text: "Chirag was a amazing knowledgeable guide. Seeing Taj Mahal was a dream come true.",
            initial: "M",
            color: "bg-blue-500"
        }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">What travelers are saying</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 fill-current ${i < review.rating ? "text-slate-900" : "text-slate-300"}`} />
                                ))}
                                <span className="ml-1 text-sm font-medium">{review.rating}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className={`${review.color} text-white`}>{review.initial}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{review.name} – {review.country}</div>
                                    <div className="text-xs text-muted-foreground">{review.date} - Verified booking</div>
                                </div>
                            </div>

                            <p className="text-slate-700 text-sm leading-relaxed">
                                {review.text}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex justify-end">
                <button className="text-sm font-medium underline underline-offset-4 hover:no-underline text-blue-600">See more reviews</button>
            </div>
        </div>
    );
}
