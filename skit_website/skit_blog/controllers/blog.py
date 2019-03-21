
from odoo import http
from odoo.http import request


class WebsiteBlog(http.Controller):
    
    @http.route(['/about_us'], type='http',
                    auth='public', website=True)
    def about_us_mtd(self, **kw):
        #print ("eaccdsfd dfgdfgd")
        return request.render('skit_website_menu.about_us')

    @http.route(['/contact_us'], type='http',
                    auth='public', website=True)
    def contact_us_mtd(self, **kw):
        return request.render('skit_website_menu.contact_us')
    
    @http.route(['/products'], type='http',
                        auth='public', website=True)
    def products_mtd(self, **kw):
        return request.render('skit_website_menu.products')    

    @http.route(['/careers'], type='http',
                    auth='public', website=True)
    def careers_mtd(self, **kw):
        return request.render('skit_website_menu.careers')

    @http.route([
        '/blog',
        '/blog/page/<int:page>',
    ], type='http', auth="public", website=True)
    def blogs(self, page=1, **post):

        """ Display the blogs in webpage        """
        values = []
        current_blogs = request.env['blog.post'].sudo().search([('id', '!=', 0)])
        if current_blogs:
            for blogs in current_blogs:
                blog_tag = '  , '.join(tag.name for tag in blogs.tag_ids)
                post_date = blogs.post_date
                values.append({'blog_title': blogs.name,
                               'blog_subtitle': blogs.subtitle,
                               'blog_tag': blog_tag,
                               'post_date': post_date.strftime("%d %b %y"),
                                #  convert the String data string into bytes and append it
                               'author_img': b'data:image/jpeg;base64,'+blogs.author_avatar  if blogs.author_avatar else False, 
                               'author_name': blogs.author_id.sudo().name,
                               })
        blog_post = values
        return request.render("website_blog.latest_blogs", {'blog_post': blog_post})