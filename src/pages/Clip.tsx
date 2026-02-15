import { useSearchParams } from 'react-router-dom';
import { YouTubeClipper } from '@/components/YouTubeClipper';

const Clip = () => {
  const [searchParams] = useSearchParams();
  const initialVideoId = searchParams.get('v') || undefined;

  return <YouTubeClipper initialVideoId={initialVideoId} />;
};

export default Clip;
