"use client";

import { useMemo } from "react";
interface BookshelfProps {
  flipbooks: Array<{
    id: string;
    title: string;
    coverImageUrl: string | null;
    createdAt: Date | string;
  }>;
}

interface BookItemProps {
  book: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    createdAt: Date | string;
  };
}
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Bookshelf({ flipbooks }: BookshelfProps) {
  // Sorting books: newer first
  const sortedFlipbooks = useMemo(() => {
    return [...flipbooks].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [flipbooks]);

  // Helper to chunk books for shelf rows
  const getRows = (books: any[], size: number) => {
    const rows = [];
    for (let i = 0; i < books.length; i += size) {
      rows.push(books.slice(i, i + size));
    }
    return rows;
  };

  return (
    <div className="space-y-16">
      {/* Dynamic Shelf Layouts */}
      <div className="relative">
        {/* Full Desktop Shelf (5 items per row) */}
        <div className="hidden xl:block space-y-20">
          {getRows(sortedFlipbooks, 5).map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-12 relative px-4 pb-10">
              {row.map((book) => (
                <BookItem key={book.id} book={book} />
              ))}
              {/* Substantial Wood Shelf - Slightly taller and closer to text */}
              <div className="absolute bottom-4 left-2 right-2 h-4 bg-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
            </div>
          ))}
        </div>

        {/* Laptop View (4 items per row) */}
        <div className="hidden lg:xl:hidden lg:block space-y-20">
          {getRows(sortedFlipbooks, 4).map((row, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-10 relative px-4 pb-10">
              {row.map((book) => (
                <BookItem key={book.id} book={book} />
              ))}
              <div className="absolute bottom-4 left-2 right-2 h-4 bg-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
            </div>
          ))}
        </div>

        {/* Tablet View (3 items per row) */}
        <div className="hidden sm:lg:hidden sm:block space-y-20">
          {getRows(sortedFlipbooks, 3).map((row, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-8 relative px-4 pb-10">
              {row.map((book) => (
                <BookItem key={book.id} book={book} />
              ))}
              <div className="absolute bottom-4 left-2 right-2 h-4 bg-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
            </div>
          ))}
        </div>

        {/* Mobile View (2 items per row) */}
        <div className="block sm:hidden space-y-20">
          {getRows(sortedFlipbooks, 2).map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-6 relative px-4 pb-10">
              {row.map((book) => (
                <BookItem key={book.id} book={book} />
              ))}
              <div className="absolute bottom-4 left-2 right-2 h-4 bg-[#D4A373] rounded-full shadow-md z-10 opacity-80"></div>
            </div>
          ))}
        </div>
      </div>

      {sortedFlipbooks.length === 0 && (
        <div className="bg-white/50 border-2 border-dashed border-stone-200 rounded-[40px] p-20 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✨</div>
            <h3 className="text-2xl font-black text-[#2D2D2D] font-quicksand">Your shelf is waiting!</h3>
            <p className="text-stone-400 font-medium max-w-xs mx-auto mt-2">Pick your favorite book to see it appear here on your magical bookshelf.</p>
        </div>
      )}
    </div>
  );
}

function BookItem({ book }: BookItemProps) {
  return (
    <div className="group flex flex-col items-center gap-6">
      <Link href={`/child/flipbooks/${book.id}`} className="block w-full">
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-xl transform transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:rotate-1 ring-4 ring-white group-hover:ring-[#E87154]/20">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#FFFAF5] p-6 text-center">
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
