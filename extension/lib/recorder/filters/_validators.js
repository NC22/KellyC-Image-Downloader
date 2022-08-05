KellyPageWatchdog.validators.push({url : 'catface.ru', host : 'catface.ru', patterns : [['catface.ru/get', 'imageOriginal'], ['/userfiles/media/previews', 'imagePreview'] ]});
KellyPageWatchdog.validators.push({url : 'patreon.com', host : 'patreon.com', patterns : [['patreon-media/p/post/', 'imageAny']]});
KellyPageWatchdog.validators.push({url : 'pinterest.', host : ['pinterest.com', 'pinterest.ru'],  patterns : [['/originals/', 'imageOriginal'], ['i.pinimg.com/474x', 'imagePreview'], ['i.pinimg.com/736x', 'imagePreview'], ['i.pinimg.com/236x', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'discord.', host : 'discord.com', patterns : [['cdn.discordapp.com/attachments', 'imageOriginal'], ['&height=', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'fanbox.cc', host : 'fanbox.cc',  patterns : [['fanbox/public/images', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'hentai-foundry.', host : 'hentai-foundry.com', patterns : [['thumb.php', 'imagePreview'], [new RegExp('pictures.hentai-foundry.com/[0-9a-zA-Z]+\/'), 'imageByDocument']]});
KellyPageWatchdog.validators.push({url : '2ch.hk', host : '2ch.hk', patterns : [[new RegExp('//2ch.hk/[a-zA-Z0-9]+/src/'), 'imageOriginal'], [new RegExp('//2ch.hk/[a-zA-Z0-9]+/thumb/'), 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'furaffinity.net', host : 'furaffinity.net', patterns : [[new RegExp('//t.[a-zA-Z0-9]+.net/[0-9]+@[0-9]+\-[0-9]+.[a-zA-Z]+'), 'imagePreview'], [new RegExp('//d.[a-zA-Z0-9]+.net/art'), 'imageByDocument']]});
// KellyPageWatchdog.validators.push({url : 'exhentai.org', host : 'exhentai.org', patterns : [[new RegExp('//exhentai.org/t/[0-9]+@[0-9]+\-[0-9]+.[a-zA-Z]+'), 'imagePreview'], ['/h/', 'imageByDocument']]});
KellyPageWatchdog.validators.push({url : 'sankakucomplex.com', host : ['sankakucomplex.com', 'chan.sankakucomplex.com'], patterns : [['data/preview/', 'imagePreview'], ['data/sample/', 'imageByDocument']]});

KellyPageWatchdog.validators.push({url : 'boards.4channel.org', host : ['4chan.org', '4channel.org'], patterns : [[new RegExp('//i.4cdn.org/[a-zA-Z0-9]+/[0-9]+s\\.[a-zA-Z]+'), 'imagePreview'], [new RegExp('//i.4cdn.org/[a-zA-Z0-9]+/[0-9]+\\.[a-zA-Z]+'), 'imageOriginal']]});

KellyPageWatchdog.filtersHelp.push({host : 'vk.com', link : 'https://www.youtube.com/watch?v=XpXhwndWYyg', loc : 'help_vk'});
KellyPageWatchdog.filtersHelp.push({host : 'twitter.com', link : 'https://www.youtube.com/watch?v=x1-kqKMnMmA', loc : 'help_twitter'});
KellyPageWatchdog.filtersHelp.push({host : 'pixiv.net', link : 'https://www.youtube.com/watch?v=1Nivs34BDbI', loc : 'help_pixiv'});
KellyPageWatchdog.filtersHelp.push({host : 'pinterest.com', link : 'https://www.youtube.com/watch?v=ImKbC_1Oz8c', loc : 'help_pinterest'});
KellyPageWatchdog.filtersHelp.push({host : 'deviantart.com', link : 'https://www.youtube.com/watch?v=O3JDEhig0P8', loc : 'help_deviantart'});
KellyPageWatchdog.filtersHelp.push({host : 'instagram.com', link : 'https://www.youtube.com/watch?v=RenHptOCnh8', loc : 'help_instagram'});
KellyPageWatchdog.filtersHelp.push({host : 'pikabu.ru', link : 'https://www.youtube.com/watch?v=QNm4L8hmoDs', loc : 'help_pikabu'});
KellyPageWatchdog.filtersHelp.push({host : '9gag.com', link : 'https://youtu.be/bTU7FpUzeao', loc : 'help_9gag'});
KellyPageWatchdog.filtersHelp.push({host : 'reddit.com', link : 'https://youtu.be/PLkNKM7Trlw', loc : 'help_reddit'});

KellyPageWatchdog.bannedUrls.push('counter.yadro.ru', 'bat.bing.com', 'ads.adfox'); 