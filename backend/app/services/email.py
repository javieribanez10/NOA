from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

class FastapiMailService:
    @staticmethod
    async def send_welcome_email(email: EmailStr, full_name: str):
        message = MessageSchema(
            subject="¡Bienvenido a ZAAS!",
            recipients=[email],
            body=f"""
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media screen and (max-width: 600px) {{
                            .container {{
                                width: 100% !important;
                                padding: 20px !important;
                            }}
                            .content {{
                                padding: 20px !important;
                            }}
                            .title {{
                                font-size: 20px !important;
                            }}
                            .button {{
                                width: 100% !important;
                                text-align: center !important;
                                padding: 15px 0 !important;
                            }}
                        }}
                        
                        * {{
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }}
                        
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            background-color: #fdf2f8;
                            color: #1f2937;
                            padding: 20px;
                            margin: 0;
                            -webkit-font-smoothing: antialiased;
                        }}
                        
                        .container {{
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 24px;
                            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }}
                        
                        .header {{
                            background: #db2777;
                            padding: 40px 20px;
                            text-align: center;
                        }}
                        
                        .celebration-icon {{
                            font-size: 48px;
                            margin-bottom: 20px;
                        }}
                        
                        .title {{
                            font-size: 28px;
                            font-weight: 800;
                            color: white;
                            margin: 20px 0;
                            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            letter-spacing: 0.5px;
                        }}
                        
                        .content {{
                            padding: 40px;
                            text-align: center;
                            background: white;
                        }}
                        
                        .welcome-text {{
                            font-size: 18px;
                            line-height: 1.6;
                            color: #4b5563;
                            margin-bottom: 25px;
                        }}
                        
                        .highlight {{
                            color: #db2777;
                            font-weight: 700;
                        }}
                        
                        .button {{
                            display: inline-block;
                            padding: 16px 40px;
                            background: white;
                            color: white; 
                            text-decoration: none;
                            border-radius: 12px;
                            border: 1px solid #4b5563;
                            font-weight: 600;
                            font-size: 16px;
                            transition: transform 0.2s;
                            margin-top: 20px;
                            box-shadow: 0 4px 12px rgba(219, 39, 119, 0.2);
                        }}

                        
                        .footer {{
                            text-align: center;
                            padding: 20px;
                            background: #fdf2f8;
                            color: #6b7280;
                            font-size: 14px;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="celebration-icon">🎉</div>
                            <h1 class="title">¡Bienvenido a ZAAS!</h1>
                            <div class="celebration-icon">✨</div>
                        </div>
                        
                        <div class="content">
                            <p class="welcome-text">
                                ¡Hola <span class="highlight">{full_name}</span>!
                            </p>
                            <p class="welcome-text">
                                Estamos emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente y ahora eres parte de nuestra comunidad.
                            </p>
                            <p class="welcome-text">
                                Prepárate para descubrir todas las increíbles funcionalidades que tenemos para ti.
                            </p>
                            <a href="http://localhost:5173/login" class="button">
                                Comenzar Ahora →
                            </a>
                        </div>
                        
                        <div class="footer">
                            <p>© 2024 ZAAS - Todos los derechos reservados</p>
                        </div>
                    </div>
                </body>
            </html>
            """,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
    
    @staticmethod
    async def send_admin_credentials_email(user_email: str, generated_password: str, user_data: dict):
        """Envía un email al administrador con las credenciales generadas para un usuario piloto"""
        message = MessageSchema(
            subject=f"Nuevo usuario piloto - Credenciales generadas: {user_email}",
            recipients=[settings.MAIL_FROM],  # Se envía al email del administrador
            body=f"""
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media screen and (max-width: 600px) {{
                            .container {{
                                width: 100% !important;
                                padding: 20px !important;
                            }}
                            .content {{
                                padding: 20px !important;
                            }}
                            .title {{
                                font-size: 20px !important;
                            }}
                            .password-container {{
                                font-size: 22px !important;
                                padding: 15px !important;
                            }}
                        }}
                        
                        * {{
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }}
                        
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            background-color: #f3f4f6;
                            color: #1f2937;
                            padding: 20px;
                            margin: 0;
                            -webkit-font-smoothing: antialiased;
                        }}
                        
                        .container {{
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 24px;
                            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }}
                        
                        .header {{
                            background: #7e22ce;
                            padding: 40px 20px;
                            text-align: center;
                        }}
                        
                        .icon {{
                            font-size: 48px;
                            margin-bottom: 20px;
                        }}
                        
                        .title {{
                            font-size: 28px;
                            font-weight: 800;
                            color: white;
                            margin: 20px 0;
                            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            letter-spacing: 0.5px;
                        }}
                        
                        .content {{
                            padding: 40px;
                            background: white;
                        }}
                        
                        .info-text {{
                            font-size: 16px;
                            line-height: 1.6;
                            color: #4b5563;
                            margin-bottom: 25px;
                        }}
                        
                        .highlight {{
                            color: #e01899;
                            font-weight: 700;
                        }}
                        
                        .user-info {{
                            background: #f9fafb;
                            border-radius: 12px;
                            padding: 20px;
                            margin-bottom: 25px;
                        }}
                        
                        .user-info p {{
                            margin: 10px 0;
                        }}
                        
                        .password-container {{
                            display: block;
                            margin: 30px auto;
                            padding: 20px;
                            background: #f3f4f6;
                            border-radius: 12px;
                            font-family: monospace;
                            font-size: 24px;
                            font-weight: 700;
                            text-align: center;
                            letter-spacing: 2px;
                            color: #1f2937;
                            border: 2px dashed #4f46e5;
                        }}
                        
                        .footer {{
                            text-align: center;
                            padding: 20px;
                            background: #f3f4f6;
                            color: #6b7280;
                            font-size: 14px;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="icon">🔐</div>
                            <h1 class="title">Credenciales de Usuario Piloto</h1>
                        </div>
                        
                        <div class="content">
                            <p class="info-text">
                                Se ha registrado un nuevo usuario para el programa piloto. Estas son las credenciales generadas automáticamente:
                            </p>
                            
                            <div class="user-info">
                                <p><strong>Email:</strong> {user_email}</p>
                                <p><strong>Nombre completo:</strong> {user_data.get('full_name', '')}</p>
                                <p><strong>Empresa:</strong> {user_data.get('company', '')}</p>
                                <p><strong>País:</strong> {user_data.get('country', '')}</p>
                                <p><strong>División:</strong> {user_data.get('division', '')}</p>
                                <p><strong>Teléfono:</strong> {user_data.get('phone', '')}</p>
                            </div>
                            
                            <p class="info-text">
                                <span class="highlight">Contraseña generada:</span>
                            </p>
                            
                            <div class="password-container">
                                {generated_password}
                            </div>
                            
                            <p class="info-text">
                                Por favor, proporciona estas credenciales al usuario una vez que hayas verificado el pago del programa piloto.
                                <br><br>
                                Para crear el usuario en el sistema, debes ir al panel de administración y usar la opción "Crear usuario piloto".
                            </p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2024 ZAAS - Panel de Administración</p>
                        </div>
                    </div>
                </body>
            </html>
            """,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        
    @staticmethod
    async def send_custom_email(email: EmailStr, subject: str, body: str):
        """Envía un email personalizado"""
        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=body,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)