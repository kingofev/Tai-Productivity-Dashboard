import React, { useState, useEffect } from 'react';

const quotes = [
    "The secret of getting ahead is getting started.",
    "The only way to do great work is to love what you do.",
    "Don’t watch the clock; do what it does. Keep going.",
    "Success is not the key to happiness. Happiness is the key to success.",
    "The future depends on what you do today.",
    "Well done is better than well said.",
    "You don’t have to be great to start, but you have to start to be great.",
    "The journey of a thousand miles begins with a single step.",
    "Act as if what you do makes a difference. It does.",
    "Focus on being productive instead of busy."
];

export const MotivationalQuote: React.FC = () => {
    const [quote, setQuote] = useState('');

    useEffect(() => {
        const getQuoteForCurrentPeriod = () => {
            // This ensures the quote changes every 6 hours
            const sixHourIntervalsSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
            const quoteIndex = sixHourIntervalsSinceEpoch % quotes.length;
            setQuote(quotes[quoteIndex]);
        };

        getQuoteForCurrentPeriod();
        
        // No need for an interval, the logic is based on the current time
    }, []);

    return (
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-100 border border-cyan-100 shadow-sm">
            <p className="italic text-slate-700">"{quote}"</p>
        </div>
    );
};
