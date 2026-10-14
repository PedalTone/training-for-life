import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys
import json
sys.dont_write_bytecode=True

spec=importlib.util.spec_from_file_location('caption_fallback',Path(__file__).parent.parent/'public/video-caption-fallback.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CaptionFallbackTests(unittest.TestCase):
    def test_clean_and_validate(self):
        self.assertEqual(module.clean_captions('WEBVTT\n\n00:00:01 --> 00:00:02\nGoblet squat\n\n00:00:02 --> 00:00:03\nGoblet squat ten reps\n'), 'Goblet squat\nten reps\n')
        self.assertEqual(module.video_id('https://youtu.be/abcdefghijk'), 'abcdefghijk')
        with self.assertRaises(ValueError): module.video_id('https://evil.example/watch?v=abcdefghijk')
        with self.assertRaises(ValueError): module.video_id('--exec=bad')
    def test_official_preferred_one_language_and_cache_prevents_new_requests(self):
        with tempfile.TemporaryDirectory() as folder:
            calls=[]
            def run(args, output=None):
                calls.append(args)
                if '--dump-single-json' in args:
                    return json.dumps({'subtitles':{'en':[{'url':'caption'}]},'automatic_captions':{'en-orig':[{'url':'auto'}]}})
                template=Path(args[args.index('-o')+1])
                (template.parent/'abcdefghijk.en.vtt').write_text('WEBVTT\n\n00:00:01 --> 00:00:02\nGoblet squat ten reps\n')
                return ''
            args=['fallback','https://youtu.be/abcdefghijk','--site-empty','--output-dir',folder]
            with patch.object(sys,'argv',args),patch.object(module.shutil,'which',return_value='/fake/yt-dlp'),patch.object(module,'run',side_effect=run):
                module.main();module.main()
            self.assertEqual(len(calls),2)
            self.assertIn('--write-subs',calls[1]);self.assertNotIn('--write-auto-subs',calls[1])
            self.assertEqual(calls[1][calls[1].index('--sub-langs')+1],'en')
            self.assertTrue(all('--skip-download' in c and '--ignore-config' in c for c in calls))
            self.assertEqual((Path(folder)/'abcdefghijk.txt').read_text(),'Goblet squat ten reps\n')
    def test_missing_official_uses_only_one_auto_caption_language(self):
        with tempfile.TemporaryDirectory() as folder:
            calls=[]
            def run(args,output=None):
                calls.append(args)
                if '--dump-single-json' in args:return json.dumps({'automatic_captions':{'en-orig':[{}],'en-US':[{}]}})
                (Path(args[args.index('-o')+1]).parent/'abcdefghijk.en-orig.vtt').write_text('Squat ten reps')
                return ''
            with patch.object(sys,'argv',['fallback','https://youtu.be/abcdefghijk','--site-empty','--output-dir',folder]),patch.object(module.shutil,'which',return_value='/fake/yt-dlp'),patch.object(module,'run',side_effect=run):module.main()
            self.assertIn('--write-auto-subs',calls[1]);self.assertEqual(calls[1][calls[1].index('--sub-langs')+1],r'en\-orig')

if __name__=='__main__': unittest.main()
