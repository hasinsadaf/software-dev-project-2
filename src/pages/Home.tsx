import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="pt-6">
      <div className="max-w-7xl mx-auto px-4">
        <PostList />
      </div>
    </div>
  );
};