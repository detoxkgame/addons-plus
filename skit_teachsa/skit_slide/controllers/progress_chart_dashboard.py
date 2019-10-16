from odoo import http
from odoo.http import request


class WebsiteProgressChartDashboard(http.Controller):
    @http.route(['/grades-subjects/progress_chart_dashboard'],
                type='json',
                auth="public",
                methods=['POST'],
                website=True)
    def progress_chart_dashboard(self, **kw):
        values = {'sub_title': 'Progress'}
        return request.env['ir.ui.view'].render_template("skit_slide.progress_chart_dashboard", values)

    @http.route(['/grades-subjects/progress_report_info'],
                type='json',
                auth="public",
                methods=['POST'],
                website=True)
    def progress_report_info(self, **kw):
        slide_channel_partners = request.env['slide.channel.partner'].sudo().search([])
        subjects = []
        total_points = []
        complete_duration_time = []
        complete_completion_time = []
        for channel_partner in slide_channel_partners:
            subjects.append(channel_partner.channel_id.name)
            total_points.append(float(channel_partner.total_points))
            duration_time = 0
            completion_time = 0
            for content_subscribed in channel_partner.content_subscribed_ids:
                completion_time = completion_time + content_subscribed.content_id.completion_time
                duration_time = duration_time + content_subscribed.duration
            complete_completion_time.append(completion_time)
            complete_duration_time.append(duration_time)
        values = {'subjects': subjects,
                  'total_points': total_points,
                  'complete_completion_time': complete_completion_time,
                  'complete_duration_time': complete_duration_time,
                  }
        return values
