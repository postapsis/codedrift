/*
 * Author: Jamius Siam
 * Since: 08/07/2026
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ReviewProgressStore = {
  reviewedFiles: Record<string, true>;
  setFileReviewed: (fileKey: string, reviewed: boolean) => void;
};

export const getReviewProgressFileKey = (
  reviewId: string,
  repositoryId: string,
  filePath: string,
): string => {
  return `${reviewId}:${repositoryId}:${filePath}`;
};

export const useReviewProgressStore = create<ReviewProgressStore>()(
  persist(
    (set) => ({
      reviewedFiles: {},
      setFileReviewed: (fileKey, reviewed): void => {
        set((state) => {
          const reviewedFiles = { ...state.reviewedFiles };

          if (reviewed) {
            reviewedFiles[fileKey] = true;
          } else {
            delete reviewedFiles[fileKey];
          }

          return { reviewedFiles };
        });
      },
    }),
    {
      name: "codedrift-review-progress",
      storage: createJSONStorage(() => localStorage),
      version: 0,
    },
  ),
);
