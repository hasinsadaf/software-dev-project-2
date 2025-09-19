import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

interface Props {
  postId: number;
}

interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
}

const vote = async (voteValue: number, postId: number, userId: string) => {
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote) {
    if (existingVote.vote === voteValue) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("votes")
        .update({ vote: voteValue })
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("votes")
      .insert({ post_id: postId, user_id: userId, vote: voteValue });
    if (error) throw new Error(error.message);
  }
};

const fetchVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return data as Vote[];
};

export const LikeButton = ({ postId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: votes,
    isLoading,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => fetchVotes(postId),
    refetchInterval: 5000,
  });

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) throw new Error("You must be logged in to Vote!");
      return vote(voteValue, postId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });
    },
  });

  if (isLoading) {
    return <div>Loading votes...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const likes = votes?.filter((v) => v.vote === 1).length || 0;
  const dislikes = votes?.filter((v) => v.vote === -1).length || 0;
  const userVote = votes?.find((v) => v.user_id === user?.id)?.vote;

  return (
    <div className="flex items-center space-x-4 my-4">
      {/* 👍 Like */}
      <button
        onClick={() => mutate(1)}
        className={`px-4 py-2 rounded-full font-medium transition-all duration-200 
          backdrop-blur-md border shadow-lg
          ${
            userVote === 1
              ? "bg-mediumteal text-tcream border-mediumteal shadow-xl hover:shadow-2xl"
              : "bg-tcream/10 dark:bg-deepteal/20 text-mediumteal dark:text-mint border-mint/20 dark:border-sage/10 hover:bg-mint/20 dark:hover:bg-mediumteal/10 hover:shadow-xl"
          }`}
      >
        👍 {likes}
      </button>

      {/* 👎 Dislike */}
      <button
        onClick={() => mutate(-1)}
        className={`px-4 py-2 rounded-full font-medium transition-all duration-200 
          backdrop-blur-md border shadow-lg
          ${
            userVote === -1
              ? "bg-red-500 text-white border-red-500 shadow-xl hover:shadow-2xl"
              : "bg-tcream/10 dark:bg-deepteal/20 text-red-500 border-mint/20 dark:border-sage/10 hover:bg-red-500/20 hover:shadow-xl"
          }`}
      >
        👎 {dislikes}
      </button>
    </div>
  );
};
