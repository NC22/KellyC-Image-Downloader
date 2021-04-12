KellyPageWatchdog.validators.push({url : 'catface.ru', host : 'catface.ru', patterns : [['catface.ru/get', 'imageOriginal'], ['/userfiles/media/previews', 'imagePreview'] ]});
KellyPageWatchdog.validators.push({url : 'reactor.cc', host : ['joyreactor.cc', 'reactor.cc'], patterns : [['pics/post', 'imageAny'], ['pics/comment', 'imageAny']]}); 
KellyPageWatchdog.validators.push({url : 'patreon.com', host : 'patreon.com', patterns : [['patreon-media/p/post/', 'imageAny']]});
KellyPageWatchdog.validators.push({url : 'pinterest.', host : ['pinterest.com', 'pinterest.ru'],  patterns : [['/originals/', 'imageOriginal'], ['i.pinimg.com/474x', 'imagePreview'], ['i.pinimg.com/736x', 'imagePreview'], ['i.pinimg.com/236x', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'discord.', host : 'discord.com', patterns : [['cdn.discordapp.com/attachments', 'imageOriginal'], ['&height=', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'reddit.com', host : 'reddit.com',  patterns : [['preview.redd.it', 'imagePreview'], ['i.redd.it', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'pikabu.ru', host : 'pikabu.ru',  patterns : [['images/previews_comm', 'imageAny'], ['/post_img/', 'imageAny'], ['post_img/big', 'imageOriginal'], ['images/big_size_comm', 'imageOriginal']]});
KellyPageWatchdog.validators.push({url : 'fanbox.cc', host : 'fanbox.cc',  patterns : [['fanbox/public/images', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'hentai-foundry.', host : 'hentai-foundry.com', patterns : [['thumb.php', 'imagePreview'], [new RegExp('pictures.hentai-foundry.com/[0-9a-zA-Z]+\/'), 'imageByDocument']]});
KellyPageWatchdog.validators.push({url : '2ch.hk', host : '2ch.hk', patterns : [[new RegExp('//2ch.hk/[a-zA-Z0-9]+/src/'), 'imageOriginal'], [new RegExp('//2ch.hk/[a-zA-Z0-9]+/thumb/'), 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'furaffinity.net', host : 'furaffinity.net', patterns : [[new RegExp('//t.facdn.net/[0-9]+@[0-9]+\-[0-9]+.[a-zA-Z]+'), 'imagePreview'], ['d.facdn.net/art', 'imageByDocument']]});
// KellyPageWatchdog.validators.push({url : 'exhentai.org', host : 'exhentai.org', patterns : [[new RegExp('//exhentai.org/t/[0-9]+@[0-9]+\-[0-9]+.[a-zA-Z]+'), 'imagePreview'], ['/h/', 'imageByDocument']]});
KellyPageWatchdog.validators.push({url : 'sankakucomplex.com', host : 'sankakucomplex.com', patterns : [['data/preview/', 'imagePreview'], ['data/sample/', 'imageByDocument']]});

KellyPageWatchdog.validators.push({url : 'boards.4channel.org', host : ['4chan.org', '4channel.org'], patterns : [[new RegExp('//i.4cdn.org/[a-zA-Z0-9]+/[0-9]+s\\.[a-zA-Z]+'), 'imagePreview'], [new RegExp('//i.4cdn.org/[a-zA-Z0-9]+/[0-9]+\\.[a-zA-Z]+'), 'imageOriginal']]});


KellyPageWatchdog.bannedUrls.push('counter.yadro.ru', 'bat.bing.com');