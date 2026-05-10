"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flipbook } from "@prisma/client";

interface BookshelfProps {
  flipbooks: Flipbook[];
}

export function Bookshelf({ flipbooks }: BookshelfProps) {
  // Group flipbooks by category
  const groupedFlipbooks = useMemo(() => {
    const groups: Record<string, Flipbook[]> = {};
    flipbooks.forEach((book) => {
      const category = book.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(book);
    });
    return groups;
  }, [flipbooks]);

  if (flipbooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Image
          src="/images/empty-bookshelf.png" // We can use a placeholder or generic image
          alt="Empty Bookshelf"
          width={200}
          height={200}
          className="opacity-50 mb-6"
        />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">No books found!</h2>
        <p className="text-slate-500 max-w-md">
          It looks like your bookshelf is empty. Ask your parent to add some books for your age group!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-16">
      {Object.entries(groupedFlipbooks).map(([category, books]) => (
        <div key={category} className="relative">
          {/* Category Header */}
          <div className="flex items-center mb-6 pl-4">
            <h2 className="text-3xl font-extrabold text-amber-800 font-sans tracking-tight">
              {category}
            </h2>
          </div>

          {/* Shelf Container */}
          <div className="relative">
            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 pb-8 z-10 relative px-4">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/child/flipbooks/${book.id}`}
                  className="group flex flex-col items-center transition-transform hover:-translate-y-2 hover:scale-105 duration-300"
                >
                  <div className="relative w-full aspect-[3/4] bg-slate-200 rounded-md shadow-[5px_5px_15px_rgba(0,0,0,0.3)] overflow-hidden group-hover:shadow-[8px_8px_20px_rgba(0,0,0,0.4)] transition-all">
                    {book.coverImageUrl ? (
                      <Image
                        src={book.coverImageUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600 p-4 text-center">
                        <span className="text-white font-bold text-lg drop-shadow-md">
                          {book.title}
                        </span>
                      </div>
                    )}
                    
                    {/* Spine highlight effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/40 to-transparent"></div>
                  </div>
                  <h3 className="mt-4 text-center font-semibold text-slate-800 line-clamp-2 px-1 group-hover:text-indigo-600 transition-colors">
                    {book.title}
                  </h3>
                </Link>
              ))}
            </div>

            {/* Wooden Shelf Graphic */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#8B5A2B] rounded-sm shadow-[inset_0_-2px_10px_rgba(0,0,0,0.3),0_5px_15px_rgba(0,0,0,0.4)] z-0 transform translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#A06934]"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#613F1E]"></div>
            </div>
            
            {/* Shelf shadow on wall */}
            <div className="absolute -bottom-6 left-2 right-2 h-6 bg-black/10 blur-md rounded-full -z-10"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
