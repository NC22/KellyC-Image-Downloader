KellyPageWatchdog.validators.push({url : 'catface.ru', host : 'catface.ru', patterns : [['catface.ru/get', 'imageOriginal'], ['/userfiles/media/previews', 'imagePreview'] ]});
KellyPageWatchdog.validators.push({url : 'reactor.cc', host : ['joyreactor.cc', 'reactor.cc'], patterns : [['pics/post', 'imageAny'], ['pics/comment', 'imageAny'], ['pics/post/full', 'imageOriginal'], ['pics/comment/full', 'imageOriginal']]}); 
KellyPageWatchdog.validators.push({url : 'patreon.com', host : 'patreon.com', patterns : [['patreon-media/p/post/', 'imageAny']]});
KellyPageWatchdog.validators.push({url : 'pinterest.', host : ['pinterest.com', 'pinterest.ru'],  patterns : [['/originals/', 'imageOriginal'], ['i.pinimg.com/474x', 'imagePreview'], ['i.pinimg.com/736x', 'imagePreview'], ['i.pinimg.com/236x', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'discord.', host : 'discord.com', patterns : [['cdn.discordapp.com/attachments', 'imageOriginal'], ['&height=', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'reddit.com', host : 'reddit.com',  patterns : [['preview.redd.it', 'imagePreview'], ['i.redd.it', 'imageOriginal']]});
KellyPageWatchdog.validators.push({url : 'pikabu.ru', host : 'pikabu.ru',  patterns : [['images/previews_comm', 'imageAny'], ['/post_img/', 'imageAny'], ['post_img/big', 'imageOriginal'], ['images/big_size_comm', 'imageOriginal']]});
KellyPageWatchdog.validators.push({url : 'fanbox.cc', host : 'fanbox.cc',  patterns : [['fanbox/public/images', 'imagePreview']]});
KellyPageWatchdog.validators.push({url : 'hentai-foundry.', host : 'hentai-foundry.com', patterns : [['thumb.php', 'imagePreview'], ['pictures.hentai-foundry.com/v', 'imageOriginal']]});
KellyPageWatchdog.validators.push({url : '2ch.hk', host : '2ch.hk', patterns : [['gg/src/', 'imageOriginal'], ['gg/thumb/', 'imagePreview']]});

KellyPageWatchdog.bannedUrls.push('counter.yadro.ru');