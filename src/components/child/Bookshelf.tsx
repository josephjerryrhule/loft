"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flipbook } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Helper to chunk books into rows (we'll assume a max of 5 for the bars)
  const getRows = (books: Flipbook[], itemsPerRow: number) => {
    const rows = [];
    for (let i = 0; i < books.length; i += itemsPerRow) {
      rows.push(books.slice(i, i + itemsPerRow));
    }
    return rows;
  };

  if (flipbooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)]">
        <div className="w-32 h-32 bg-[#E87154]/5 rounded-full flex items-center justify-center mb-8">
           <span className="text-6xl">📖</span>
        </div>
        <h2 className="text-3xl font-black text-[#2D2D2D] mb-3 font-quicksand">Your bookshelf is empty!</h2>
        <p className="text-[#6D6D6D] max-w-md font-medium text-lg leading-relaxed">
          Ask your parent to add some magical books for you to start your adventure!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-48 pb-20">
      {Object.entries(groupedFlipbooks).map(([category, books]) => (
        <div key={category} className="space-y-16">
          {/* Category Header */}
          <div className="flex items-end justify-between px-2">
            <div className="space-y-1">
              <span className="text-xs font-black text-[#E87154] uppercase tracking-[0.3em] font-quicksand">Collection</span>
              <h2 className="text-4xl font-black text-[#2D2D2D] font-quicksand tracking-tight">
                {category}
              </h2>
            </div>
            <Link 
              href={`/child/library?category=${encodeURIComponent(category)}`}
              className="flex items-center gap-2 text-[#BBBBBB] font-black text-sm uppercase tracking-widest hover:text-[#E87154] transition-all cursor-pointer group px-4 py-2 bg-white rounded-xl border border-transparent hover:border-[#E87154]/10 hover:shadow-sm"
            >
              View All <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Unified Shelf Row Rendering */}
          <div className="space-y-32">
            {/* Desktop View (5 items per row) */}
            <div className="hidden xl:block space-y-48">
              {getRows(books, 5).map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-12 relative px-4 pb-10">
                  {row.map((book) => (
                    <BookItem key={book.id} book={book} />
                  ))}
                  {/* Substantial Wood Shelf - Slightly taller and closer to text */}
                  <div className="absolute bottom-4 left-2 right-2 h-4 bg-gradient-to-r from-[#D4A373] via-[#E5C49F] to-[#D4A373] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-10 opacity-80"></div>
                </div>
              ))}
            </div>

            {/* Laptop View (4 items per row) */}
            <div className="hidden lg:block xl:hidden space-y-48">
              {getRows(books, 4).map((row, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-10 relative px-4 pb-10">
                  {row.map((book) => (
                    <BookItem key={book.id} book={book} />
                  ))}
                  <div className="absolute bottom-4 left-2 right-2 h-4 bg-gradient-to-r from-[#D4A373] via-[#E5C49F] to-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
                </div>
              ))}
            </div>

            {/* Tablet View (3 items per row) */}
            <div className="hidden md:block lg:hidden space-y-48">
              {getRows(books, 3).map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-8 relative px-4 pb-10">
                  {row.map((book) => (
                    <BookItem key={book.id} book={book} />
                  ))}
                  <div className="absolute bottom-4 left-2 right-2 h-4 bg-gradient-to-r from-[#D4A373] via-[#E5C49F] to-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
                </div>
              ))}
            </div>

            {/* Mobile View (2 items per row) */}
            <div className="block md:hidden space-y-48">
              {getRows(books, 2).map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-6 relative px-4 pb-10">
                  {row.map((book) => (
                    <BookItem key={book.id} book={book} />
                  ))}
                  <div className="absolute bottom-4 left-2 right-2 h-4 bg-gradient-to-r from-[#D4A373] via-[#E5C49F] to-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .-rotate-y-12 {
          transform: rotateY(-12deg);
        }
      `}</style>
    </div>
  );
}

function BookItem({ book }: { book: Flipbook }) {
  return (
    <div className="relative group flex flex-col items-center">
      <Link
        href={`/child/flipbooks/${book.id}`}
        className="relative z-20 w-full aspect-[3/4] mb-4 transform group-hover:-translate-y-4 transition-all duration-500 origin-bottom"
      >
        <div className="relative w-full h-full rounded-r-xl overflow-hidden bg-white shadow-[0_15px_35px_rgba(0,0,0,0.1)] group-hover:shadow-[0_25px_55px_rgba(232,113,84,0.3)] group-hover:-rotate-y-12 transition-all duration-500 origin-left border border-[#F0F0F0] group-hover:border-[#E87154]/20">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E87154]/10 to-[#E87154]/5 p-6 text-center">
              <span className="text-[#E87154] font-black text-base font-quicksand leading-tight">
                {book.title}
              </span>
            </div>
          )}
          
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/10 border-r border-white/10"></div>
        </div>
      </Link>
      
      {/* Book Info - Now closer to the book, with more space below it to the shelf */}
      <div className="text-center w-full px-1 relative z-20">
        <h3 className="text-sm font-black text-[#2D2D2D] font-quicksand leading-tight group-hover:text-[#E87154] transition-colors line-clamp-2">
          {book.title}
        </h3>
      </div>
    </div>
  );
}
