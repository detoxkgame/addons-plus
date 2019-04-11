
from odoo import http, fields
from odoo.http import request
import werkzeug
from odoo.addons.http_routing.models.ir_http import slug, unslug
from bs4 import BeautifulSoup

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
        '''/blog/<model("blog.blog", "[('website_id', 'in', (False, current_website_id))]"):blog>''',
        '''/blog/<model("blog.blog"):blog>/page/<int:page>''',
        '''/blog/<model("blog.blog"):blog>/tag/<string:tag>''',
        '''/blog/<model("blog.blog"):blog>/tag/<string:tag>/page/<int:page>''',
    ], type='http', auth="public", website=True)
    def blog(self, blog=None, tag=None, page=1, **opt):
        """ Dispaly the blog in website.

        :return dict values: values for the templates, containing

         - 'blogs': all blogs for navigation

        """
        if not blog.can_access_from_current_website():
            raise werkzeug.exceptions.NotFound()

        date_begin, date_end, state = opt.get('date_begin'), opt.get('date_end'),  opt.get('state')

        domain = request.website.website_domain()

        BlogPost = request.env['blog.post']

        active_tag_ids = tag and [int(unslug(t)[1]) for t in tag.split(',')] or []
        if active_tag_ids:
            domain += [('tag_ids', 'in', active_tag_ids)]
        if blog:
            domain += [('blog_id', '=', blog.id)]
        post={}
        blog_posts = BlogPost.sudo().search(domain, order="post_date desc")
        for vlogs in blog_posts:
            content_arr = BeautifulSoup(vlogs.content).get_text()
            extra_content = ""
            if (len(content_arr)>220):
                extra_content = "..."
            post[vlogs.id] = content_arr[1:220]+extra_content

        values = {
            'blog_posts': blog_posts,
            'post': post,
        }
        response = request.render("website_blog.latest_blogs", values)
        return response
